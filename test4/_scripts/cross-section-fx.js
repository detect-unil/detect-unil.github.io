// Makes the cross-section behind the homepage title worth working on.
//
// The section is the one thing on this site that is actually a piece of
// geology rather than a picture of one: _scripts/cross-section.js keeps it as
// a model and repaints it on demand, so it can be deformed, restored, drilled
// and measured after it has been drawn. Six behaviours are written here and
// one is chosen at random on every visit, the same way the section itself is
// grown afresh on every visit.
//
// PREVIEW ONLY. The picker in the corner of the section steps through the six
// so one can be settled on. Once it is, delete the other five and the picker
// with them; nothing outside this file and _styles/cross-section-fx.scss
// refers to any of it, and with the script gone the section is simply drawn
// and left alone, exactly as it was.
//
// Force one with ?csfx=restore (or lens, borehole, probe, dip, slip), or pin
// one in the picker, which remembers it in this browser.

{
  const NS = "http://www.w3.org/2000/svg";

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
      .map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`)
      .join(" ") + close;

  const text = (x, y, content, extra = {}) => {
    const element = node("text", { class: "annotation", x, y, ...extra });
    element.textContent = content;
    return element;
  };

  const still = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

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

  // where the pointer is, in the section's own coordinates
  const pointAt = (svg, event) => {
    const box = svg.getBoundingClientRect();
    if (!box.width || !box.height) return null;
    const section = svg.section;
    return {
      x: ((event.clientX - box.left) / box.width) * section.width,
      y: ((event.clientY - box.top) / box.height) * section.height,
    };
  };

  const metres = (section, pixels) => Math.round(pixels * section.scale);

  const unitName = (unit) =>
    unit < 0 ? "air" : unit === 0 ? "basement" : `unit ${String(unit).padStart(2, "0")}`;

  // --- 1. restore -----------------------------------------------------------
  //
  // Click and the section runs backwards: the fault gives its throw back, the
  // folds open out, the fractures close, and the land surface goes back to
  // being the flat one the youngest bed was laid down on. Click again and all
  // of it happens forwards. This is what the group does for a living, done in
  // one and a half seconds.

  const restore = (ctx) => {
    const { svg, section, say, signal } = ctx;
    const model = section.model;
    const handle = { frame: 0 };
    signal.addEventListener("abort", () =>
      window.cancelAnimationFrame(handle.frame)
    );

    let restored = false;
    let busy = false;

    // whoever looks at this next should find the section as it was drawn
    signal.addEventListener("abort", () => {
      model.strain = 1;
      section.paint();
    });

    const run = () => {
      if (busy) return;
      busy = true;

      const from = model.strain;
      const fromSlip = model.slip;
      const to = restored ? 1 : 0;
      const going = restored ? "deforming" : "restoring";

      tween(
        handle,
        1600,
        (t) => {
          model.strain = from + (to - from) * t;
          model.slip = fromSlip * (1 - t);
          section.paint();
          say(
            `${going} · throw ${metres(section, section.throwAt())} m · ` +
              `strain ${Math.round(model.strain * 100)}%`
          );
        },
        () => {
          restored = !restored;
          busy = false;
          say(
            restored
              ? "restored · before deformation · click to deform"
              : "deformed · click to restore"
          );
        }
      );
    };

    svg.addEventListener("click", run, { signal });
    say("click to restore the section");
  };

  // --- 2. lens --------------------------------------------------------------
  //
  // A hand lens over the section. What is under it comes up nearly three
  // times, and with it the hairline fractures that are below the limit of what
  // the section is drawn at, the way a lens is the difference between a rock
  // that is fractured and a rock that is not.

  const lens = (ctx) => {
    const { svg, section, overlay, say, hush, signal } = ctx;
    const RADIUS = 54;
    const POWER = 2.8;

    const glassId = "csfx-glass";
    const clip = node("clipPath", { id: glassId });
    const edge = node("circle", { r: RADIUS, cx: -999, cy: -999 });
    clip.append(edge);
    overlay.append(clip);

    // a still copy of the section as drawn, magnified about the middle of the
    // lens. Ids are dropped so that the copy never answers to the original's
    const copy = section.body.cloneNode(true);
    copy.removeAttribute("id");
    copy.querySelectorAll("[id]").forEach((child) => child.removeAttribute("id"));

    const magnified = node("g");
    // the section is drawn in washes, so without paper of its own behind it
    // the magnified copy would print over the section it is standing on and
    // come out twice as heavy
    magnified.append(
      node("rect", {
        class: "glass",
        x: -section.width,
        y: -section.height,
        width: section.width * 3,
        height: section.height * 3,
      })
    );
    magnified.append(copy);

    // fabric too fine to have been drawn at the scale of the section
    const detail = node("g", { class: "fine" });
    for (let i = 0; i < 4200; i++) {
      const x = rand(0, section.width);
      const y = rand(0, section.height);
      if (section.unitAt(x, y) < 0) continue;
      const angle = (rand(0, 180) * Math.PI) / 180;
      const length = rand(1.2, 3.4);
      detail.append(
        node("line", {
          x1: (x - (Math.cos(angle) * length) / 2).toFixed(1),
          y1: (y - (Math.sin(angle) * length) / 2).toFixed(1),
          x2: (x + (Math.cos(angle) * length) / 2).toFixed(1),
          y2: (y + (Math.sin(angle) * length) / 2).toFixed(1),
        })
      );
    }
    magnified.append(detail);

    const barrel = node("g", { "clip-path": `url(#${glassId})` });
    barrel.append(magnified);

    const ring = node("circle", { class: "lens-ring", r: RADIUS, cx: -999, cy: -999 });
    const glint = node("path", { class: "lens-glint" });
    const glass = node("g", { class: "lens" });
    glass.append(barrel, ring, glint);
    overlay.append(glass);

    const place = (x, y) => {
      edge.setAttribute("cx", x.toFixed(1));
      edge.setAttribute("cy", y.toFixed(1));
      ring.setAttribute("cx", x.toFixed(1));
      ring.setAttribute("cy", y.toFixed(1));
      magnified.setAttribute(
        "transform",
        `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${POWER}) ` +
          `translate(${(-x).toFixed(1)} ${(-y).toFixed(1)})`
      );
      const arc = RADIUS - 9;
      glint.setAttribute(
        "d",
        `M${(x - arc * 0.78).toFixed(1)} ${(y - arc * 0.5).toFixed(1)} ` +
          `A${arc} ${arc} 0 0 1 ${(x - arc * 0.4).toFixed(1)} ${(y - arc * 0.86).toFixed(1)}`
      );
    };

    const follow = (event) => {
      const at = pointAt(svg, event);
      if (!at) return;
      place(at.x, at.y);
      const unit = section.unitAt(at.x, at.y);
      const below = at.y - section.topoAt(at.x);
      say(
        below < 0
          ? "hand lens ×10 · above ground"
          : `hand lens ×10 · ${unitName(unit)} · ${metres(section, below)} m below surface`
      );
    };

    svg.addEventListener("pointerenter", (event) => {
      svg.dataset.probing = "true";
      follow(event);
    }, { signal });
    svg.addEventListener("pointermove", follow, { signal });
    svg.addEventListener("pointerleave", () => {
      delete svg.dataset.probing;
      hush();
    }, { signal });

    place(section.width / 2, section.height / 2);
    say("hand lens ×10");
  };

  // --- 3. borehole ----------------------------------------------------------
  //
  // Click and a hole is drilled where the pointer is. It is logged the way a
  // hole is logged: a strip of the units it went through, in their own
  // colours, with the depth of every contact posted against it. Three holes,
  // and the fourth click abandons them.

  const borehole = (ctx) => {
    const { svg, section, overlay, say, hush, signal } = ctx;
    const holes = node("g", { class: "logs" });
    overlay.append(holes);

    let drilled = 0;

    const log = (x) => {
      const collar = section.topoAt(x);
      const beds = [];
      let current = section.unitAt(x, collar + 0.5);
      let start = collar;
      for (let y = collar + 1; y <= section.height; y += 1) {
        const unit = section.unitAt(x, y);
        if (unit === current) continue;
        beds.push({ unit: current, top: start, base: y });
        current = unit;
        start = y;
      }
      beds.push({ unit: current, top: start, base: section.height });
      return { collar, beds };
    };

    const drill = (x) => {
      if (drilled >= 3) {
        holes.replaceChildren();
        drilled = 0;
        say("abandoned · click to drill again");
        return;
      }

      drilled += 1;
      const { collar, beds } = log(x);
      // the strip goes on whichever side of the hole there is room for it
      const side = x > section.width - 130 ? -1 : 1;
      const stripX = x + side * 7;

      const hole = node("g", { class: "log" });
      hole.append(
        node("line", {
          class: "hole",
          x1: x.toFixed(1),
          y1: collar.toFixed(1),
          x2: x.toFixed(1),
          y2: section.height,
        })
      );

      beds.forEach((bed) => {
        hole.append(
          node("rect", {
            class: bed.unit > 0 ? `unit unit-${bed.unit}` : "basement",
            x: (side > 0 ? stripX : stripX - 13).toFixed(1),
            y: bed.top.toFixed(1),
            width: 13,
            height: Math.max(0, bed.base - bed.top).toFixed(1),
          })
        );
      });

      // contacts, posted at their depth, and only where the last one is far
      // enough above for the two to be read apart
      let lastLabel = -99;
      beds.forEach((bed, index) => {
        if (!index) return;
        hole.append(
          node("line", {
            class: "pick",
            x1: (side > 0 ? stripX : stripX - 13).toFixed(1),
            y1: bed.top.toFixed(1),
            x2: (side > 0 ? stripX + 13 : stripX).toFixed(1),
            y2: bed.top.toFixed(1),
          })
        );
        if (bed.top - lastLabel < 13) return;
        lastLabel = bed.top;
        hole.append(
          text(
            (side > 0 ? stripX + 17 : stripX - 17).toFixed(1),
            (bed.top + 3).toFixed(1),
            `${metres(section, bed.top - collar)} m`,
            { "text-anchor": side > 0 ? "start" : "end" }
          )
        );
      });

      hole.append(
        node("line", {
          class: "collar",
          x1: (x - 7).toFixed(1),
          y1: collar.toFixed(1),
          x2: (x + 7).toFixed(1),
          y2: collar.toFixed(1),
        })
      );
      hole.append(
        text(x.toFixed(1), (collar - 9).toFixed(1), `BH-${drilled}`, {
          "text-anchor": "middle",
        })
      );

      holes.append(hole);

      const cut = beds.filter((bed) => bed.unit > 0).length;
      say(
        `BH-${drilled} · TD ${metres(section, section.height - collar)} m · ` +
          `${cut} unit${cut === 1 ? "" : "s"} cut`
      );
    };

    svg.addEventListener("click", (event) => {
      const at = pointAt(svg, event);
      if (at) drill(clamp(at.x, 40, section.width - 40));
    }, { signal });
    svg.addEventListener("pointerenter", () => {
      if (!drilled) say("click to drill");
    }, { signal });
    svg.addEventListener("pointerleave", () => {
      if (!drilled) hush();
    }, { signal });

    say("click to drill");
  };

  // --- 4. probe -------------------------------------------------------------
  //
  // The pointer becomes a pick. Wherever it is in the section, the unit under
  // it is picked out everywhere else it crops out, so its shape across the
  // whole section reads at once, and its depth and thickness are given.

  const probe = (ctx) => {
    const { svg, section, overlay, say, hush, signal } = ctx;

    const guide = node("g", { class: "probe", opacity: 0 });
    const rule = node("line", { class: "guide", y1: 0, y2: section.height });
    const dot = node("circle", { class: "pick-dot", r: 3 });
    const surface = node("line", { class: "to-surface" });
    guide.append(rule, surface, dot);
    overlay.append(guide);

    const follow = (event) => {
      const at = pointAt(svg, event);
      if (!at) return;
      guide.setAttribute("opacity", 1);
      rule.setAttribute("x1", at.x.toFixed(1));
      rule.setAttribute("x2", at.x.toFixed(1));
      dot.setAttribute("cx", at.x.toFixed(1));
      dot.setAttribute("cy", at.y.toFixed(1));

      const top = section.topoAt(at.x);
      surface.setAttribute("x1", at.x.toFixed(1));
      surface.setAttribute("y1", top.toFixed(1));
      surface.setAttribute("x2", at.x.toFixed(1));
      surface.setAttribute("y2", at.y.toFixed(1));

      const unit = section.unitAt(at.x, at.y);
      if (unit > 0) svg.dataset.lit = unit;
      else delete svg.dataset.lit;

      if (unit < 0) {
        say(`air · ${metres(section, top - at.y)} m above the surface`);
        return;
      }

      const thickness =
        unit > 0
          ? section.boundaryAt(unit, at.x) - section.boundaryAt(unit - 1, at.x)
          : 0;
      say(
        `${unitName(unit)} · ${metres(section, at.y - top)} m below surface` +
          (unit > 0 ? ` · ${metres(section, thickness)} m thick` : "")
      );
    };

    svg.addEventListener("pointerenter", follow, { signal });
    svg.addEventListener("pointermove", follow, { signal });
    svg.addEventListener("pointerleave", () => {
      guide.setAttribute("opacity", 0);
      delete svg.dataset.lit;
      hush();
    }, { signal });
    signal.addEventListener("abort", () => delete svg.dataset.lit);

    say("move over the section to pick a unit");
  };

  // --- 5. dip ---------------------------------------------------------------
  //
  // Click and a bedding attitude is taken where the pointer is, read off the
  // section's own geometry rather than made up: the symbol is planted at the
  // outcrop, at the angle the beds actually make there. Click along the
  // section and it fills up with stations, the way a day's mapping does.

  const dip = (ctx) => {
    const { svg, section, overlay, say, hush, signal } = ctx;
    const stations = node("g", { class: "stations" });
    overlay.append(stations);

    // a cross-section has to be told which way round it is before a dip can
    // be given a direction
    const ends = node("g", { class: "ends" });
    ends.append(text(14, (section.topoAt(14) - 9).toFixed(1), "W"));
    ends.append(
      text(
        section.width - 14,
        (section.topoAt(section.width - 14) - 9).toFixed(1),
        "E",
        { "text-anchor": "end" }
      )
    );
    overlay.append(ends);

    let taken = 0;

    const measure = (x) => {
      if (taken >= 6) {
        stations.replaceChildren();
        taken = 0;
        say("stations cleared · click to measure");
        return;
      }

      taken += 1;
      const y = section.topoAt(x);
      // parallel folding, so every boundary has the same attitude here
      const slope =
        (section.boundaryAt(1, x + 4) - section.boundaryAt(1, x - 4)) / 8;
      const angle = Math.atan(slope);
      const amount = Math.round((Math.abs(angle) * 180) / Math.PI);
      const towards = slope >= 0 ? "E" : "W";
      const unit = section.unitAt(x, y + 2);

      const bar = 24;
      const dx = (Math.cos(angle) * bar) / 2;
      const dy = (Math.sin(angle) * bar) / 2;
      // the tick hangs on the down-dip side of the bedding
      const tick = 8;
      const tx = -Math.sin(angle) * tick * (slope >= 0 ? 1 : -1);
      const ty = Math.cos(angle) * tick * (slope >= 0 ? 1 : -1);

      const mark = node("g", { class: "station" });
      mark.append(node("circle", { class: "station-dot", cx: x.toFixed(1), cy: y.toFixed(1), r: 2.4 }));
      mark.append(
        node("line", {
          class: "bedding",
          x1: (x - dx).toFixed(1),
          y1: (y - dy).toFixed(1),
          x2: (x + dx).toFixed(1),
          y2: (y + dy).toFixed(1),
        })
      );
      mark.append(
        node("line", {
          class: "bedding",
          x1: x.toFixed(1),
          y1: y.toFixed(1),
          x2: (x + tx).toFixed(1),
          y2: (y + ty).toFixed(1),
        })
      );
      // a bed with no dip has no direction to dip in, which happens at the
      // hinge of every fold
      const reading = amount ? `${amount}° ${towards}` : "horizontal";
      mark.append(
        text(x.toFixed(1), (y - 12).toFixed(1), reading, {
          "text-anchor": "middle",
        })
      );
      stations.append(mark);

      say(
        `station ${String(taken).padStart(2, "0")} · bedding ${reading} · ${unitName(unit)}`
      );
    };

    svg.addEventListener("click", (event) => {
      const at = pointAt(svg, event);
      if (at) measure(clamp(at.x, 24, section.width - 24));
    }, { signal });
    svg.addEventListener("pointerenter", () => {
      if (!taken) say("click the section to take a bedding reading");
    }, { signal });
    svg.addEventListener("pointerleave", () => {
      if (!taken) hush();
    }, { signal });

    say("click the section to take a bedding reading");
  };

  // --- 6. slip --------------------------------------------------------------
  //
  // Click and the fault moves. Each click is one slip event: the hanging wall
  // drops a little further, the whole section takes the knock, and a few more
  // fractures open in the damage zone beside the fault. The throw on the
  // label counts up until the fault has more offset than it can carry, and
  // the next click heals it.

  const slip = (ctx) => {
    const { svg, section, say, hush, signal } = ctx;
    const model = section.model;
    const handle = { frame: 0 };
    signal.addEventListener("abort", () => {
      window.cancelAnimationFrame(handle.frame);
      model.slip = 0;
      section.paint();
    });

    const CEILING = model.throwDistance * 1.4;
    let events = 0;

    const damage = () => {
      // fractures nucleate in the wall rock beside the fault, which is where
      // a fault puts them
      const swarm = pick(model.swarms);
      for (let i = 0; i < 4; i++) {
        const unit = 1 + Math.floor(rand(0, 3));
        const depth =
          model.depths[unit] +
          (model.depths[unit + 1] - model.depths[unit]) * rand(0.15, 0.85);
        const x = clamp(
          section.faultAt(depth) + rand(-46, 46),
          0,
          section.width
        );
        swarm.push({
          x,
          unit,
          through: rand(0.15, 0.85),
          angle: (rand(-78, 78) * Math.PI) / 180,
          length: rand(6, 16),
        });
      }
    };

    const rupture = () => {
      if (model.slip >= CEILING) {
        const from = model.slip;
        say("annealed · the fault is healed");
        tween(handle, 700, (t) => {
          model.slip = from * (1 - t);
          section.paint();
        });
        events = 0;
        return;
      }

      events += 1;
      const step = rand(6, 14);
      const from = model.slip;
      const to = from + step;
      damage();

      tween(handle, 260, (t) => {
        model.slip = from + (to - from) * t;
        section.paint();
      });

      say(
        `slip event ${String(events).padStart(2, "0")} · ` +
          `${metres(section, step)} m on F1 · ` +
          `cumulative throw ${metres(section, section.throwAt())} m`
      );

      svg.classList.remove("is-slipping");
      void svg.getBoundingClientRect().width;
      svg.classList.add("is-slipping");
    };

    svg.addEventListener(
      "animationend",
      () => svg.classList.remove("is-slipping"),
      { signal }
    );
    svg.addEventListener("click", rupture, { signal });
    svg.addEventListener("pointerleave", () => {
      if (!events) hush();
    }, { signal });

    say("click to slip the fault");
  };

  // --- the six --------------------------------------------------------------

  const VARIANTS = [
    { name: "restore", hint: "click to restore", build: restore },
    { name: "lens", hint: "hand lens", build: lens },
    { name: "borehole", hint: "click to drill", build: borehole },
    { name: "probe", hint: "pick a unit", build: probe },
    { name: "dip", hint: "click to measure", build: dip },
    { name: "slip", hint: "click to slip", build: slip },
  ];

  const STORE = "detect-csfx";

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
      // a browser that refuses storage still gets a behaviour, just not a pinned one
    }
  };

  const start = () => {
    const svg = document.querySelector(".cross-section");
    if (!svg) return;

    let controller = null;
    let showing = null;

    const apply = (name) => {
      const variant = VARIANTS.find((one) => one.name === name) || VARIANTS[0];
      showing = variant;
      document.documentElement.dataset.csfx = variant.name;

      const section = svg.section;
      if (!section) return variant;

      controller?.abort();
      controller = new AbortController();

      svg.classList.remove("is-slipping");
      delete svg.dataset.lit;
      delete svg.dataset.probing;
      svg.dataset.fx = variant.name;

      const overlay = section.overlay;
      overlay.replaceChildren();

      // the air above the section is not painted, so without something to
      // take the pointer, half of the section would not answer to it
      overlay.append(
        node("rect", {
          class: "hit",
          x: 0,
          y: 0,
          width: section.width,
          height: section.height,
        })
      );

      const readout = text(24, 26, "");
      readout.setAttribute("class", "annotation readout");
      readout.setAttribute("opacity", 0);
      overlay.append(readout);

      variant.build({
        svg,
        section,
        overlay,
        signal: controller.signal,
        say: (words) => {
          readout.textContent = words;
          readout.setAttribute("opacity", 1);
        },
        hush: () => readout.setAttribute("opacity", 0),
      });

      return variant;
    };

    // --- the picker ---------------------------------------------------------
    //
    // PREVIEW ONLY: delete this block, and the .csfx-picker rules in
    // _styles/cross-section-fx.scss, once one of the six has been settled on.

    const picker = document.createElement("div");
    picker.className = "csfx-picker";

    const label = document.createElement("span");
    label.className = "csfx-picker-label";
    label.textContent = "Section fx";

    const back = document.createElement("button");
    back.type = "button";
    back.className = "csfx-picker-step";
    back.setAttribute("aria-label", "Previous behaviour");
    back.textContent = "◂";

    const forward = document.createElement("button");
    forward.type = "button";
    forward.className = "csfx-picker-step";
    forward.setAttribute("aria-label", "Next behaviour");
    forward.textContent = "▸";

    const name = document.createElement("span");
    name.className = "csfx-picker-name";

    const hint = document.createElement("span");
    hint.className = "csfx-picker-hint";

    const pin = document.createElement("button");
    pin.type = "button";
    pin.className = "csfx-picker-pin";

    picker.append(label, back, name, forward, hint, pin);
    svg.parentElement?.append(picker);

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

    const asked = new URLSearchParams(window.location.search).get("csfx");
    const chosen =
      (asked && asked !== "random" && VARIANTS.some((one) => one.name === asked)
        ? asked
        : null) ||
      (asked === "random" ? null : remembered()) ||
      pick(VARIANTS).name;

    // the section is regrown when the window changes width, and everything
    // hung off it goes with it, so it is all hung again
    svg.addEventListener("cross-section:drawn", () => {
      apply(showing ? showing.name : chosen);
      write();
    });

    apply(chosen);
    write();
  };

  if (document.readyState === "loading")
    window.addEventListener("DOMContentLoaded", start);
  else start();
}
