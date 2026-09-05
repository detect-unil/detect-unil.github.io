// Makes the map units on the homepage worth touching.
//
// The two research axes are printed as map units: a box filled with a
// lithology, lettered with the unit's code. A box of rock is a thing a
// geologist tilts, hits with a hammer, and looks at through a lens, so these
// ones let the reader do that. Six behaviours are written here and one is
// chosen at random on every visit, the same way the cross-section at the top
// of the page is drawn afresh on every visit.
//
// PREVIEW ONLY. The picker printed under the blocks steps through the six so
// one can be settled on. Once it is, delete the other five behaviours and the
// picker with them; nothing else on the site refers to any of this, and with
// the script gone the boxes fall back to the flat CSS fills in sheet.scss.
//
// Force one with ?litho=fault (or fold, fracture, lens, dip, core), or pin one
// in the picker, which remembers it in this browser.

{
  const NS = "http://www.w3.org/2000/svg";

  // the box in its own drawing units, matching _styles/unit-block.scss
  const W = 64;
  const H = 48;

  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = (array) => array[Math.floor(Math.random() * array.length)];
  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

  const node = (name, attributes = {}) => {
    const element = document.createElementNS(NS, name);
    for (const [key, value] of Object.entries(attributes))
      if (value !== undefined && value !== null)
        element.setAttribute(key, value);
    return element;
  };

  const path = (points, close = "") =>
    points
      .map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`)
      .join(" ") + close;

  // sample a function of x across the box, a little past both edges so a
  // folded band never runs out before the clip does
  const sample = (fn, step = 4) => {
    const points = [];
    for (let x = -step; x <= W + step; x += step) points.push([x, fn(x)]);
    return points;
  };

  const still = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const ease = (t) => 1 - Math.pow(1 - t, 3);

  // one tween per handle: starting a new one on the same handle cancels the
  // last, and where reduced motion is asked for the end state is simply set
  const tween = (handle, ms, step, done) => {
    window.cancelAnimationFrame(handle.frame);
    if (still() || ms <= 0) {
      step(1);
      done?.();
      return;
    }
    const started = performance.now();
    const run = (now) => {
      const t = clamp((now - started) / ms, 0, 1);
      step(ease(t));
      if (t < 1) handle.frame = window.requestAnimationFrame(run);
      else done?.();
    };
    handle.frame = window.requestAnimationFrame(run);
  };

  let serial = 0;
  const uid = (what) => `litho-${what}-${++serial}`;

  // --- lithology fills ------------------------------------------------------
  //
  // The same six fills the stylesheet draws in CSS, drawn again as SVG
  // patterns so that they can be clipped, offset, folded and magnified. Every
  // one is inked in currentColor, so a pattern carrying a unit class comes out
  // in that unit's colour.

  const LITHOLOGY = {
    1: { rule: 45, gap: 4 },
    2: { rule: 0, gap: 4 },
    3: { grains: 5 },
    4: { rule: -45, gap: 4 },
    5: { mesh: [9, 5] },
    6: { rule: 90, gap: 6 },
  };

  const lithology = (defs, which, scale = 1, unit) => {
    const spec = LITHOLOGY[which] || LITHOLOGY[1];
    const id = uid("fill");
    // line weight grows more slowly than the spacing, because a fabric seen
    // through a lens reads as finer relative to its spacing, not heavier
    const weight = (0.9 * Math.pow(scale, 0.55)).toFixed(2);
    const pattern = node("pattern", {
      id,
      class: unit ? `u${unit}` : null,
      patternUnits: "userSpaceOnUse",
    });

    if (spec.rule !== undefined) {
      const gap = spec.gap * scale;
      pattern.setAttribute("width", gap);
      pattern.setAttribute("height", gap);
      pattern.setAttribute("patternTransform", `rotate(${spec.rule})`);
      pattern.append(
        node("line", {
          class: "fabric",
          x1: 0,
          y1: 0.5 * scale,
          x2: gap,
          y2: 0.5 * scale,
          "stroke-width": weight,
        })
      );
    } else if (spec.grains) {
      const gap = spec.grains * scale;
      pattern.setAttribute("width", gap);
      pattern.setAttribute("height", gap);
      pattern.append(
        node("circle", {
          class: "grain",
          cx: gap / 2,
          cy: gap / 2,
          r: (0.75 * scale).toFixed(2),
        })
      );
    } else {
      const [across, down] = spec.mesh.map((value) => value * scale);
      pattern.setAttribute("width", across);
      pattern.setAttribute("height", down);
      pattern.append(
        node("line", {
          class: "fabric",
          x1: 0,
          y1: 0.5 * scale,
          x2: across,
          y2: 0.5 * scale,
          "stroke-width": weight,
        }),
        node("line", {
          class: "fabric",
          x1: 0.5 * scale,
          y1: 0,
          x2: 0.5 * scale,
          y2: down,
          "stroke-width": weight,
        })
      );
    }

    defs.append(pattern);
    return `url(#${id})`;
  };

  // everything is drawn oversize and cut to the box, the way a map sheet cuts
  // the geology at the neat line rather than stopping it there
  const cutToBox = (defs) => {
    const id = uid("box");
    const clip = node("clipPath", { id });
    clip.append(node("rect", { x: 0, y: 0, width: W, height: H }));
    defs.append(clip);
    return node("g", { "clip-path": `url(#${id})` });
  };

  // --- 1. fault -------------------------------------------------------------
  //
  // Click and the unit slips. A normal fault at a sensible dip cuts the box,
  // the hanging wall drops, and the bedding inside it steps across the trace.
  // Slip is cumulative, one event per click, until the throw has eaten the
  // whole box, at which point the rock anneals and a fresh fault nucleates.

  const fault = (ctx) => {
    const { svg, defs, box, signal, say, hush } = ctx;
    const SCALE = 2; // metres per drawing unit
    const MAX = 15;
    const far = H;

    const window_ = cutToBox(defs);
    svg.append(window_);

    const fill = lithology(defs, ctx.pattern);

    // Bedding at irregular spacings, because evenly spaced beds and a throw
    // of about the same size cancel each other out and the fault reads as no
    // fault at all. One bed is a marker horizon, set high enough in the box
    // that it is still in it once the fault has taken up all its throw.
    const levels = [];
    for (let y = -far + rand(0, 9); y < H + far; y += rand(7, 16)) levels.push(y);
    const marker = levels.reduce((best, y) =>
      Math.abs(y - 9) < Math.abs(best - 9) ? y : best
    );

    // a slab of this unit, far taller than the box so that dropping one half
    // of it never opens a hole at the top
    const slab = () => {
      const group = node("g");
      const frame = { x: -far, y: -far, width: W + 2 * far, height: H + 2 * far };
      group.append(node("rect", { class: "wash", ...frame }));
      group.append(node("rect", { ...frame, fill }));
      group.append(
        node("rect", {
          class: "marker",
          x: -far,
          y: marker.toFixed(2),
          width: W + 2 * far,
          height: 4,
        })
      );
      levels.forEach((y) =>
        group.append(
          node("line", { class: "contact", x1: -far, y1: y, x2: W + far, y2: y })
        )
      );
      return group;
    };

    let dip = 0;
    let cot = 0;
    let originX = 0;
    let hanging = 1;
    let offset = 0;

    const nucleate = () => {
      dip = rand(54, 76);
      const facing = pick([-1, 1]);
      cot = facing / Math.tan((dip * Math.PI) / 180);
      originX = rand(0.34, 0.66) * W;
      // a fault leaning one way hangs its hanging wall on that side
      hanging = facing > 0 ? 1 : -1;
      offset = 0;
    };

    const at = (y) => originX + (y - H / 2) * cot;

    const sideOf = (sign) => {
      const edge = sign > 0 ? W + far : -far;
      return path(
        [
          [edge, -far],
          [at(-far), -far],
          [at(H + far), H + far],
          [edge, H + far],
        ],
        " Z"
      );
    };

    const footClip = node("clipPath", { id: uid("foot") });
    const footEdge = node("path");
    footClip.append(footEdge);
    const hangClip = node("clipPath", { id: uid("hang") });
    const hangEdge = node("path");
    hangClip.append(hangEdge);
    defs.append(footClip, hangClip);

    const footwall = node("g", { "clip-path": `url(#${footClip.id})` });
    footwall.append(slab());
    const hangingwall = node("g", { "clip-path": `url(#${hangClip.id})` });
    const dropped = node("g");
    dropped.append(slab());
    hangingwall.append(dropped);

    const trace = node("path", { class: "fault" });
    const slip = node("g", { class: "slip" });
    window_.append(footwall, hangingwall, trace, slip);

    // sense of slip: down on the hanging wall, up on the footwall
    // the unit's letters sit across the middle of the box, so the sense of
    // slip is marked below them rather than beside them
    const SLIP_Y = H * 0.82;

    const arrow = (dx, direction) => {
      const y = SLIP_Y;
      const x = at(y) + dx;
      const half = 4.2;
      const tip = y + half * direction;
      const group = node("g");
      group.append(
        node("line", { x1: x, y1: y - half * direction, x2: x, y2: tip })
      );
      group.append(
        node("path", {
          d:
            `M${(x - 2.1).toFixed(2)} ${(tip - 2.5 * direction).toFixed(2)} ` +
            `L${x.toFixed(2)} ${tip.toFixed(2)} ` +
            `L${(x + 2.1).toFixed(2)} ${(tip - 2.5 * direction).toFixed(2)}`,
        })
      );
      return group;
    };

    const shape = () => {
      footEdge.setAttribute("d", sideOf(-hanging));
      hangEdge.setAttribute("d", sideOf(hanging));
      trace.setAttribute(
        "d",
        path([
          [at(-far), -far],
          [at(H + far), H + far],
        ])
      );
      slip.replaceChildren(arrow(8 * hanging, 1), arrow(-8 * hanging, -1));
    };

    let shown = 0;
    const show = (value) => {
      shown = value;
      dropped.setAttribute("transform", `translate(0 ${value.toFixed(2)})`);
    };

    const reading = () =>
      `F1 · normal · ${Math.round(dip)}° · throw ${Math.round(offset * SCALE)} m`;

    const handle = { frame: 0 };
    signal.addEventListener("abort", () =>
      window.cancelAnimationFrame(handle.frame)
    );

    const rupture = () => {
      if (offset >= MAX) {
        const from = shown;
        say("annealed");
        tween(handle, 520, (t) => show(from * (1 - t)), () => {
          nucleate();
          shape();
        });
        return;
      }

      const from = shown;
      offset += rand(3, 5);
      const to = offset;
      tween(handle, 240, (t) => show(from + (to - from) * t));
      say(reading());

      // a slip event is sudden, so the box takes a knock with it
      box.classList.remove("is-slipping");
      void box.offsetWidth;
      box.classList.add("is-slipping");
    };

    box.addEventListener(
      "animationend",
      () => box.classList.remove("is-slipping"),
      { signal }
    );
    box.addEventListener("click", rupture, { signal });
    box.addEventListener(
      "pointerenter",
      () => say(offset ? reading() : "click to slip"),
      { signal }
    );
    box.addEventListener("pointerleave", hush, { signal });

    nucleate();
    shape();
    show(0);
  };

  // --- 2. fold --------------------------------------------------------------
  //
  // Hover and the beds buckle. The unit is bedded rather than massive, the
  // boundaries are resampled every frame against a growing sine, and the
  // axial trace of the anticline is ruled in as the fold tightens.

  const foldUp = (ctx) => {
    const { svg, defs, box, signal, say, hush } = ctx;
    const SCALE = 2;
    const THICKNESS = 7.5;
    const far = H / 2;

    const window_ = cutToBox(defs);
    svg.append(window_);

    const fill = lithology(defs, ctx.pattern);

    const wave = rand(0.85, 1.35) * W;
    const phase = rand(0, wave);
    const tilt = rand(-0.07, 0.07);
    const peak = rand(5.5, 8.5);
    let amp = 0;

    const flexure = (x) =>
      (amp / peak) *
      (peak * Math.sin((2 * Math.PI * (x + phase)) / wave) + tilt * (x - W / 2));

    // the crest of whichever anticline happens to sit in view
    let crest = 0;
    for (let x = 0; x <= W; x += 1) {
      const here = peak * Math.sin((2 * Math.PI * (x + phase)) / wave) + tilt * (x - W / 2);
      const best = peak * Math.sin((2 * Math.PI * (crest + phase)) / wave) + tilt * (crest - W / 2);
      if (here < best) crest = x;
    }

    window_.append(
      node("rect", {
        class: "wash",
        x: -far,
        y: -far,
        width: W + 2 * far,
        height: H + 2 * far,
      })
    );

    const tops = [];
    for (let y = -far; y < H + far; y += THICKNESS) tops.push(y);

    // alternating beds: one carrying the unit's fabric, the next a plainer
    // wash, so that the fold is legible in a box this small
    const bands = tops.map((y, index) => {
      const band = node("path");
      if (index % 2) band.setAttribute("class", "band-alt");
      else band.setAttribute("fill", fill);
      return band;
    });
    const contacts = tops.map(() => node("path", { class: "contact" }));

    const axis = node("path", {
      class: "axis",
      d: path([
        [crest, -2],
        [crest, H + 2],
      ]),
      opacity: 0,
    });

    window_.append(...bands, ...contacts, axis);

    const redraw = () => {
      tops.forEach((y, index) => {
        const top = sample((x) => y + flexure(x));
        const base = sample((x) => y + THICKNESS + flexure(x));
        bands[index].setAttribute(
          "d",
          `${path(top)} ${path(base.reverse()).replace("M", "L")} Z`
        );
        contacts[index].setAttribute("d", path(top));
      });
      axis.setAttribute("opacity", (amp / peak).toFixed(2));
    };

    const handle = { frame: 0 };
    signal.addEventListener("abort", () =>
      window.cancelAnimationFrame(handle.frame)
    );

    const to = (target, ms) => {
      const from = amp;
      tween(handle, ms, (t) => {
        amp = from + (target - from) * t;
        redraw();
      });
    };

    box.addEventListener(
      "pointerenter",
      () => {
        to(peak, 560);
        say(
          `anticline · λ ${Math.round(wave * SCALE)} m · amplitude ${Math.round(
            peak * SCALE
          )} m`
        );
      },
      { signal }
    );
    box.addEventListener(
      "pointerleave",
      () => {
        to(0, 420);
        hush();
      },
      { signal }
    );

    redraw();
  };

  // --- 3. fracture ----------------------------------------------------------
  //
  // Click and the unit fractures. Two conjugate sets propagate across the
  // box, one generation per click, each finer than the last, with the trace
  // intensity counted up as they go. A fourth click seals them.

  const fracture = (ctx) => {
    const { svg, defs, box, signal, say, hush } = ctx;
    // at this zoom the box is a patch of outcrop about 3 m across, which is
    // the scale at which P21 is a number a structural geologist recognises
    const SCALE = 0.05;
    const AREA = W * SCALE * (H * SCALE);
    const GENERATIONS = [
      { count: 9, longest: 24, weight: 1.1 },
      { count: 12, longest: 16, weight: 0.85 },
      { count: 15, longest: 10, weight: 0.65 },
    ];

    const window_ = cutToBox(defs);
    svg.append(window_);

    const fill = lithology(defs, ctx.pattern);
    window_.append(node("rect", { class: "wash", x: 0, y: 0, width: W, height: H }));
    window_.append(node("rect", { x: 0, y: 0, width: W, height: H, fill }));

    let swarm = node("g", { class: "fractures" });
    window_.append(swarm);

    // conjugate sets share a bisector, so they are read as one event
    const bisector = rand(-14, 14);
    const half = rand(52, 68);
    const sets = [bisector + half, bisector - half];

    let generation = 0;
    let traces = 0;

    const handle = { frame: 0 };
    signal.addEventListener("abort", () =>
      window.cancelAnimationFrame(handle.frame)
    );

    const crack = (spec, delay) => {
      const angle = (pick(sets) * Math.PI) / 180;
      const length = rand(spec.longest * 0.45, spec.longest);
      const x = rand(1, W - 1);
      const y = rand(1, H - 1);
      const dx = (Math.cos(angle) * length) / 2;
      const dy = (Math.sin(angle) * length) / 2;

      const line = node("line", {
        x1: (x - dx).toFixed(2),
        y1: (y - dy).toFixed(2),
        x2: (x + dx).toFixed(2),
        y2: (y + dy).toFixed(2),
        "stroke-width": spec.weight,
      });

      // a fracture is not placed, it propagates, so each one is drawn in from
      // its own nucleation point and they do not all arrive together
      if (!still()) {
        line.style.strokeDasharray = length.toFixed(2);
        line.style.strokeDashoffset = length.toFixed(2);
        line.style.transition = `stroke-dashoffset 200ms ease-out ${delay}ms`;
        window.requestAnimationFrame(() => {
          line.style.strokeDashoffset = "0";
        });
      }

      traces += length;
      return line;
    };

    const propagate = () => {
      if (generation >= GENERATIONS.length) {
        // the sealed set fades out on its own group, so that a click during
        // the fade nucleates into a fresh one instead of being wiped with it
        const sealed = swarm;
        swarm = node("g", { class: "fractures" });
        window_.append(swarm);
        say("sealed · annealed");
        tween(
          handle,
          480,
          (t) => sealed.setAttribute("opacity", (1 - t).toFixed(2)),
          () => sealed.remove()
        );
        generation = 0;
        traces = 0;
        return;
      }

      const spec = GENERATIONS[generation];
      for (let i = 0; i < spec.count; i++) swarm.append(crack(spec, i * 22));
      generation += 1;

      say(
        `2 sets · ${Math.abs(Math.round(sets[0]))}° / ${Math.abs(
          Math.round(sets[1])
        )}° · P21 ${((traces * SCALE) / AREA).toFixed(1)} m⁻¹`
      );
    };

    box.addEventListener("click", propagate, { signal });
    box.addEventListener(
      "pointerenter",
      () => say(generation ? `generation ${generation} of 3` : "click to fracture"),
      { signal }
    );
    box.addEventListener("pointerleave", hush, { signal });
  };

  // --- 4. lens --------------------------------------------------------------
  //
  // A hand lens follows the pointer over the box. Under it the fabric comes
  // up nearly three times, and the grains and the hairline fractures that are
  // below the limit of the printed fill are there to be seen.

  const lens = (ctx) => {
    const { svg, defs, box, signal, say, hush } = ctx;
    const RADIUS = 13;
    const POWER = 2.8;

    const window_ = cutToBox(defs);
    svg.append(window_);

    window_.append(node("rect", { class: "wash", x: 0, y: 0, width: W, height: H }));
    window_.append(
      node("rect", {
        x: 0,
        y: 0,
        width: W,
        height: H,
        fill: lithology(defs, ctx.pattern),
      })
    );

    const glassId = uid("glass");
    const glassClip = node("clipPath", { id: glassId });
    const glassEdge = node("circle", { r: RADIUS, cx: W / 2, cy: H / 2 });
    glassClip.append(glassEdge);
    defs.append(glassClip);

    const magnified = node("g");
    const field = { x: -W, y: -H, width: 3 * W, height: 3 * H };
    // a lens gathers light, so what is under it is laid over paper rather
    // than over the wash of the rock around it, and comes out lighter
    magnified.append(node("rect", { class: "glass", ...field }));
    magnified.append(node("rect", { class: "wash", ...field }));
    magnified.append(
      node("rect", { ...field, fill: lithology(defs, ctx.pattern, POWER) })
    );

    // the grains and the microfractures only exist under the lens, which is
    // the whole point of carrying one
    for (let i = 0; i < 90; i++) {
      const rx = rand(0.35, 1.1);
      const cx = rand(-2, W + 2);
      const cy = rand(-2, H + 2);
      magnified.append(
        node("ellipse", {
          class: "clast",
          cx: cx.toFixed(2),
          cy: cy.toFixed(2),
          rx: rx.toFixed(2),
          ry: (rx * rand(0.5, 0.9)).toFixed(2),
          transform: `rotate(${Math.round(rand(0, 180))} ${cx.toFixed(2)} ${cy.toFixed(2)})`,
        })
      );
    }
    for (let i = 0; i < 24; i++) {
      const angle = (rand(0, 180) * Math.PI) / 180;
      const length = rand(2, 6);
      const x = rand(0, W);
      const y = rand(0, H);
      magnified.append(
        node("line", {
          class: "microfracture",
          x1: (x - (Math.cos(angle) * length) / 2).toFixed(2),
          y1: (y - (Math.sin(angle) * length) / 2).toFixed(2),
          x2: (x + (Math.cos(angle) * length) / 2).toFixed(2),
          y2: (y + (Math.sin(angle) * length) / 2).toFixed(2),
        })
      );
    }

    const glass = node("g", { class: "lens" });
    const barrel = node("g", { "clip-path": `url(#${glassId})` });
    barrel.append(magnified);

    const ring = node("circle", { class: "lens-ring", r: RADIUS });
    const glint = node("path", { class: "lens-glint" });
    glass.append(barrel, ring, glint);
    window_.append(glass);

    const place = (x, y) => {
      glassEdge.setAttribute("cx", x.toFixed(2));
      glassEdge.setAttribute("cy", y.toFixed(2));
      ring.setAttribute("cx", x.toFixed(2));
      ring.setAttribute("cy", y.toFixed(2));
      // magnify about the centre of the lens, so the fabric under the ring
      // stays put and only grows
      magnified.setAttribute(
        "transform",
        `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${POWER}) translate(${(-x).toFixed(
          2
        )} ${(-y).toFixed(2)})`
      );
      const arc = RADIUS - 3.4;
      glint.setAttribute(
        "d",
        `M${(x - arc * 0.78).toFixed(2)} ${(y - arc * 0.5).toFixed(2)} ` +
          `A${arc} ${arc} 0 0 1 ${(x - arc * 0.42).toFixed(2)} ${(y - arc * 0.85).toFixed(2)}`
      );
    };

    const follow = (event) => {
      const rect = box.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      place(
        clamp(((event.clientX - rect.left) / rect.width) * W, 0, W),
        clamp(((event.clientY - rect.top) / rect.height) * H, 0, H)
      );
    };

    box.addEventListener(
      "pointerenter",
      (event) => {
        box.dataset.probing = "true";
        follow(event);
        say("hand lens ×10 · fabric");
      },
      { signal }
    );
    box.addEventListener("pointermove", follow, { signal });
    box.addEventListener(
      "pointerleave",
      () => {
        delete box.dataset.probing;
        hush();
      },
      { signal }
    );

    place(W / 2, H / 2);
  };

  // --- 5. dip ---------------------------------------------------------------
  //
  // Hover and the box lies down into the attitude of the bedding, with the
  // strike and dip symbol drawn on the plane and the reading given in the
  // margin. The box is tipped rather than the symbol spun, because a strike
  // and dip symbol is the map's answer and the tip is the outcrop's.

  const dip = (ctx) => {
    const { svg, defs, box, signal, say, hush } = ctx;
    const QUADRANTS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

    const strike = Math.round(rand(0, 359));
    const amount = Math.round(rand(22, 68));
    const towards = (strike + 90) % 360;
    const quadrant = QUADRANTS[Math.round(towards / 45) % 8];

    const window_ = cutToBox(defs);
    svg.append(window_);

    window_.append(node("rect", { class: "wash", x: 0, y: 0, width: W, height: H }));
    window_.append(
      node("rect", {
        x: 0,
        y: 0,
        width: W,
        height: H,
        fill: lithology(defs, ctx.pattern),
      })
    );

    // north is up, so an azimuth runs along (sin, -cos)
    const along = (azimuth, length) => [
      (Math.sin((azimuth * Math.PI) / 180) * length) / 2,
      (-Math.cos((azimuth * Math.PI) / 180) * length) / 2,
    ];

    // The strike line is ruled right across the box, so that whichever way it
    // runs it comes out from behind the unit's letters on both sides. The dip
    // tick is hung far enough along it to clear them too.
    const [sx, sy] = along(strike, 96);
    const [ax, ay] = along(strike, 38);
    const [dx, dy] = along(towards, 15);

    const symbol = node("g", { class: "symbol", opacity: 0 });
    symbol.append(
      node("line", {
        x1: (W / 2 - sx).toFixed(2),
        y1: (H / 2 - sy).toFixed(2),
        x2: (W / 2 + sx).toFixed(2),
        y2: (H / 2 + sy).toFixed(2),
      })
    );
    symbol.append(
      node("line", {
        x1: (W / 2 + ax).toFixed(2),
        y1: (H / 2 + ay).toFixed(2),
        x2: (W / 2 + ax + dx).toFixed(2),
        y2: (H / 2 + ay + dy).toFixed(2),
      })
    );
    window_.append(symbol);

    // the tip is a reading of the dip, not the dip itself: past about forty
    // degrees on screen the lettering in the box stops being readable
    box.style.setProperty("--tilt", `${(amount * 0.6).toFixed(1)}deg`);
    box.style.setProperty("--swing", `${(Math.sin((strike * Math.PI) / 180) * 13).toFixed(1)}deg`);

    box.addEventListener(
      "pointerenter",
      () => {
        box.dataset.tilted = "true";
        symbol.setAttribute("opacity", 1);
        say(
          `bedding · ${String(strike).padStart(3, "0")}/${String(amount).padStart(
            2,
            "0"
          )} ${quadrant}`
        );
      },
      { signal }
    );
    box.addEventListener(
      "pointerleave",
      () => {
        delete box.dataset.tilted;
        symbol.setAttribute("opacity", 0);
        hush();
      },
      { signal }
    );
  };

  // --- 6. core --------------------------------------------------------------
  //
  // The box is a window onto a borehole. Move up and down it and the log runs
  // past, through all six lithologies of the sheet, with the depth read off
  // against the box. Let go and it settles back on this unit's own bed.

  const core = (ctx) => {
    const { svg, defs, box, signal, say, hush } = ctx;
    const SCALE = 4; // metres of section per drawing unit
    const HOME = 6;

    const window_ = cutToBox(defs);
    svg.append(window_);

    const column = node("g");
    window_.append(column);

    // a plausible succession: the box's own unit sits in the middle of it, so
    // that at rest the box is exactly what it was before the script ran
    const beds = [];
    let depth = 0;
    for (let i = 0; i < 13; i++) {
      // the home bed is thicker than the box, so that at rest the box is
      // exactly the flat unit it was before the script ran
      const thickness = i === HOME ? H + rand(14, 26) : rand(15, 34);
      const unit =
        i === HOME ? ctx.unit : 1 + ((i * 2 + Math.floor(rand(0, 3))) % 6);
      const which = i === HOME ? ctx.pattern : unit;
      beds.push({ top: depth, thickness, unit, which });
      depth += thickness;
    }
    const total = depth;

    beds.forEach((bed) => {
      const group = node("g", { class: `u${bed.unit}` });
      group.append(
        node("rect", {
          class: "wash",
          x: 0,
          y: bed.top.toFixed(2),
          width: W,
          height: bed.thickness.toFixed(2),
        })
      );
      group.append(
        node("rect", {
          x: 0,
          y: bed.top.toFixed(2),
          width: W,
          height: bed.thickness.toFixed(2),
          fill: lithology(defs, bed.which, 1, bed.unit),
        })
      );
      group.append(
        node("line", {
          class: "contact",
          x1: 0,
          y1: bed.top.toFixed(2),
          x2: W,
          y2: bed.top.toFixed(2),
        })
      );
      column.append(group);
    });

    // the depth scale, ruled down the left margin of the log
    const scale = node("g", { class: "ticks" });
    for (let y = 0; y <= total; y += 5)
      scale.append(
        node("line", {
          class: "tick",
          x1: 0,
          y1: y.toFixed(2),
          x2: y % 25 === 0 ? 6 : 3,
          y2: y.toFixed(2),
        })
      );
    column.append(scale);

    const rest = H / 2 - (beds[HOME].top + beds[HOME].thickness / 2);
    const reach = total * 0.62;

    let target = rest;
    let current = rest;
    let running = false;
    let reading = false;

    const draw = () => {
      column.setAttribute("transform", `translate(0 ${current.toFixed(2)})`);
    };

    const at = () => {
      const y = H / 2 - current;
      const bed = beds.find((one) => y >= one.top && y < one.top + one.thickness);
      return {
        depth: Math.max(0, Math.round(y * SCALE)),
        unit: bed ? bed.unit : ctx.unit,
      };
    };

    let frame = 0;
    const settle = () => {
      current += (target - current) * 0.2;
      const here = at();
      // only while the pointer is on the box: the settle that follows it
      // leaving must not put the reading back up behind it
      if (reading)
        say(`borehole · depth ${here.depth} m · unit ${String(here.unit).padStart(2, "0")}`);
      draw();
      if (Math.abs(target - current) > 0.15) frame = window.requestAnimationFrame(settle);
      else {
        current = target;
        draw();
        running = false;
      }
    };

    const run = () => {
      if (running) return;
      running = true;
      if (still()) {
        current = target;
        draw();
        running = false;
        return;
      }
      frame = window.requestAnimationFrame(settle);
    };

    signal.addEventListener("abort", () => window.cancelAnimationFrame(frame));

    const follow = (event) => {
      const rect = box.getBoundingClientRect();
      if (!rect.height) return;
      const t = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      // pointer down means going deeper, so the log rides up past the box
      target = clamp(rest + (0.5 - t) * reach, H - total, 0);
      run();
    };

    box.addEventListener(
      "pointerenter",
      (event) => {
        reading = true;
        follow(event);
        say("borehole · move to log");
      },
      { signal }
    );
    box.addEventListener("pointermove", follow, { signal });
    box.addEventListener(
      "pointerleave",
      () => {
        reading = false;
        target = rest;
        run();
        hush();
      },
      { signal }
    );

    draw();
  };

  // --- the six --------------------------------------------------------------

  const VARIANTS = [
    { name: "fault", hint: "click to slip", build: fault },
    { name: "fold", hint: "hover to buckle", build: foldUp },
    { name: "fracture", hint: "click to fracture", build: fracture },
    { name: "lens", hint: "hover: hand lens", build: lens },
    { name: "dip", hint: "hover for attitude", build: dip },
    { name: "core", hint: "hover: borehole log", build: core },
  ];

  const STORE = "detect-litho";

  const remembered = () => {
    try {
      return window.localStorage.getItem(STORE);
    } catch (error) {
      return null;
    }
  };

  const remember = (name) => {
    try {
      if (name) window.localStorage.setItem(STORE, name);
      else window.localStorage.removeItem(STORE);
    } catch (error) {
      // a browser that refuses storage still gets a variant, just not a pinned one
    }
  };

  const start = () => {
    const blocks = document.querySelector(".unit-blocks");
    const boxes = [...document.querySelectorAll(".unit-block .unit-code")];
    if (!blocks || !boxes.length) return;

    const cells = boxes.map((box) => {
      const block = box.closest(".unit-block");
      block.classList.add("has-litho");

      const readout = document.createElement("span");
      readout.className = "litho-readout";
      readout.setAttribute("aria-hidden", "true");
      block.append(readout);

      return {
        box,
        readout,
        controller: null,
        pattern: Number(box.dataset.pattern) || 1,
        unit: Number(block.dataset.unit) || 1,
      };
    });

    let showing = null;

    const apply = (name) => {
      const variant =
        VARIANTS.find((one) => one.name === name) || VARIANTS[0];
      showing = variant;

      cells.forEach((cell) => {
        cell.controller?.abort();
        cell.controller = new AbortController();

        cell.box.querySelector("svg.litho")?.remove();
        cell.box.classList.remove("is-slipping");
        cell.box.removeAttribute("style");
        delete cell.box.dataset.tilted;
        delete cell.box.dataset.probing;
        cell.readout.textContent = "";
        cell.readout.dataset.shown = "false";
        cell.box.dataset.fx = variant.name;

        const svg = node("svg", {
          class: "litho",
          viewBox: `0 0 ${W} ${H}`,
          preserveAspectRatio: "none",
          focusable: "false",
          "aria-hidden": "true",
        });
        const defs = node("defs");
        svg.append(defs);
        cell.box.prepend(svg);

        variant.build({
          svg,
          defs,
          box: cell.box,
          pattern: cell.pattern,
          unit: cell.unit,
          signal: cell.controller.signal,
          say: (text) => {
            cell.readout.textContent = text;
            cell.readout.dataset.shown = "true";
          },
          hush: () => {
            cell.readout.dataset.shown = "false";
          },
        });
      });

      document.documentElement.dataset.litho = variant.name;
      return variant;
    };

    // --- the picker ---------------------------------------------------------
    //
    // PREVIEW ONLY: delete this block, and the .litho-picker rules in
    // _styles/unit-fx.scss, once one of the six has been settled on.

    const picker = document.createElement("div");
    picker.className = "litho-picker";

    const label = document.createElement("span");
    label.className = "litho-picker-label";
    label.textContent = "Lithology fx";

    const back = document.createElement("button");
    back.type = "button";
    back.className = "litho-picker-step";
    back.setAttribute("aria-label", "Previous effect");
    back.textContent = "◂";

    const forward = document.createElement("button");
    forward.type = "button";
    forward.className = "litho-picker-step";
    forward.setAttribute("aria-label", "Next effect");
    forward.textContent = "▸";

    const name = document.createElement("span");
    name.className = "litho-picker-name";

    const hint = document.createElement("span");
    hint.className = "litho-picker-hint";

    const pin = document.createElement("button");
    pin.type = "button";
    pin.className = "litho-picker-pin";

    picker.append(label, back, name, forward, hint, pin);
    blocks.after(picker);

    const write = () => {
      const index = VARIANTS.indexOf(showing);
      name.textContent = `${index + 1}/${VARIANTS.length} · ${showing.name}`;
      hint.textContent = showing.hint;
      const pinned = remembered() === showing.name;
      pin.textContent = pinned ? "pinned" : "pin";
      pin.dataset.on = String(pinned);
    };

    const step = (by) => {
      const index = VARIANTS.indexOf(showing);
      apply(VARIANTS[(index + by + VARIANTS.length) % VARIANTS.length].name);
      if (remembered()) remember(showing.name);
      write();
    };

    back.addEventListener("click", () => step(-1));
    forward.addEventListener("click", () => step(1));
    pin.addEventListener("click", () => {
      remember(remembered() === showing.name ? null : showing.name);
      write();
    });

    // --- which one ----------------------------------------------------------

    const asked = new URLSearchParams(window.location.search).get("litho");
    const chosen =
      (asked && asked !== "random" && VARIANTS.some((one) => one.name === asked)
        ? asked
        : null) ||
      (asked === "random" ? null : remembered()) ||
      pick(VARIANTS).name;

    apply(chosen);
    write();
  };

  if (document.readyState === "loading")
    window.addEventListener("DOMContentLoaded", start);
  else start();
}
