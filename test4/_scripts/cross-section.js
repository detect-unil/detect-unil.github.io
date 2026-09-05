// Draws the geological cross-section behind the homepage title.
//
// The section is synthetic and is grown in the browser, so it is different on
// every visit: the fold wavelength, the layer thicknesses, the dip and throw
// of the fault and the fracture swarms are all drawn at random within ranges
// that keep the result geologically sensible. The caption on the page says as
// much, because this is an illustration of what the group studies and not a
// section of anywhere in particular.
//
// Geometry is generated at the element's own pixel size rather than in an
// abstract viewBox that is then scaled, so hairlines stay hairlines and the
// annotations stay legible at any width.
//
// The section is held as a model -- the fold, the topography, the bed depths,
// the fault and the fracture swarms kept as numbers -- and paint() turns that
// model into paths. Keeping the two apart is what lets the section be worked
// on after it has been drawn: _scripts/cross-section-fx.js moves the numbers
// and asks for it to be painted again. The model carries a strain with it,
// 1 for the section as drawn and 0 for the same rocks before any of it
// happened, which is the whole of the restoration.

{
  const NS = "http://www.w3.org/2000/svg";

  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = (array) => array[Math.floor(Math.random() * array.length)];

  // metres per pixel, only used to label the section plausibly
  const SCALE = 2.5;

  const node = (name, attributes = {}) => {
    const element = document.createElementNS(NS, name);
    for (const [key, value] of Object.entries(attributes))
      element.setAttribute(key, value);
    return element;
  };

  const path = (points, close = "") =>
    points
      .map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`)
      .join(" ") + close;

  // sample a function of x across the width, at a step fine enough that the
  // folds read as curves rather than as a chain of straight segments
  const sample = (width, fn, step = 8) => {
    const points = [];
    for (let x = -step; x <= width + step; x += step) points.push([x, fn(x)]);
    return points;
  };

  // --- the model ------------------------------------------------------------
  //
  // Every shape in the drawing is a function of these numbers and of the
  // strain, so moving one of them and painting again moves the geology.

  const foldAt = (m, x) =>
    m.strain *
    (m.amp * Math.sin((2 * Math.PI * (x + m.phase)) / m.wave) +
      m.amp2 * Math.sin((2 * Math.PI * (x + m.phase2)) / m.wave2) +
      m.tilt * (x - m.width / 2));

  const reliefAt = (m, x) =>
    m.relief * Math.sin((2 * Math.PI * (x + m.topoPhase)) / m.topoWave) +
    m.relief *
      0.35 *
      Math.sin((2 * Math.PI * (x + m.topoPhase * 3)) / (m.topoWave / 2.7));

  // the land surface follows the structure a little, the way a fold belt
  // weathers into ridges and valleys, but not slavishly. Restored, it is the
  // depositional surface instead: flat, because none of that has happened yet
  const topoAt = (m, x) =>
    m.topoBase - 0.3 * foldAt(m, x) + m.strain * reliefAt(m, x);

  const boundaryAt = (m, i, x) => m.depths[i] + foldAt(m, x);

  const throwAt = (m) => m.strain * m.throwDistance + m.slip;

  const faultAt = (m, y) => m.faultX + (y - m.topoBase) * m.cot;

  // which unit is at a point, allowing for the wall it is standing on:
  // 0 for the basement, 1 to count for the units, -1 for the air
  const unitAt = (m, x, y) => {
    if (y < topoAt(m, x)) return -1;
    const hanging = (x - faultAt(m, y)) * m.hangingSign > 0;
    const depth = hanging ? y - throwAt(m) : y;
    for (let i = 1; i <= m.count; i++)
      if (depth < boundaryAt(m, i, x)) return i;
    return 0;
  };

  // fracture swarms: two conjugate sets, in the units this group would
  // actually map them in. Each wall carries its own, because two exposures of
  // one formation are never fractured quite alike. Each fracture is kept as
  // the unit it sits in and how far through it, so that it folds with the bed
  // rather than hanging in space when the section is restored.
  const swarm = (m) => {
    const set = [rand(58, 74), -rand(58, 74)];
    const cracks = [];
    for (let i = 0; i < Math.round(m.width / 14); i++) {
      const x = rand(0, m.width);
      const unit = Math.floor(rand(1, 4));
      const top = boundaryAt(m, unit, x);
      const base = boundaryAt(m, unit + 1, x);
      if (base - top < 12) continue;
      const y = rand(top + 3, base - 3);
      const angle = ((Math.random() < 0.5 ? set[0] : set[1]) * Math.PI) / 180;
      const length = rand(6, Math.min(22, (base - top) * 0.8));
      cracks.push({ x, unit, through: (y - top) / (base - top), angle, length });
    }
    return cracks;
  };

  const grow = (width, height) => {
    const m = { width, height, strain: 1, slip: 0 };

    // folding, as a long wave with a shorter one riding on it and a regional
    // tilt, applied to every boundary alike so the beds stay parallel
    m.wave = rand(0.55, 1.05) * width;
    m.phase = rand(0, m.wave);
    m.amp = height * rand(0.05, 0.1);
    m.wave2 = rand(0.16, 0.3) * width;
    m.phase2 = rand(0, m.wave2);
    m.amp2 = height * rand(0.012, 0.028);
    m.tilt = rand(-0.09, 0.09);

    m.relief = height * rand(0.03, 0.06);
    m.topoWave = rand(0.3, 0.5) * width;
    m.topoPhase = rand(0, m.topoWave);
    m.topoBase = height * rand(0.26, 0.34);

    // six conformable units over a basement
    m.count = 6;
    const thickness = [];
    for (let i = 0; i < m.count; i++)
      thickness.push(height * rand(0.075, 0.135));

    m.depths = [];
    let depth = m.topoBase + height * rand(0.02, 0.09);
    for (let i = 0; i <= m.count; i++) {
      m.depths.push(depth);
      depth += thickness[i] ?? 0;
    }

    // one fault, dipping steeply, cutting the whole section
    m.dip = rand(58, 76);
    const facing = pick([-1, 1]);
    m.cot = facing / Math.tan((m.dip * Math.PI) / 180);
    m.faultX = rand(0.3, 0.7) * width;
    m.throwDistance = height * rand(0.06, 0.13);
    // a fault dipping to the right hangs its hanging wall on the right
    m.hangingSign = facing > 0 ? 1 : -1;

    m.swarms = [swarm(m), swarm(m)];

    // the axis of whichever fold happens to sit in view, found on the fold as
    // drawn so that it stays put while the section is being restored
    m.crest = 0;
    const unstrained = (x) =>
      m.amp * Math.sin((2 * Math.PI * (x + m.phase)) / m.wave) +
      m.amp2 * Math.sin((2 * Math.PI * (x + m.phase2)) / m.wave2) +
      m.tilt * (x - m.width / 2);
    for (let x = 0; x <= width; x += 6)
      if (unstrained(x) < unstrained(m.crest)) m.crest = x;

    return m;
  };

  // --- the drawing ----------------------------------------------------------

  const build = (svg, m) => {
    const { width, height } = m;
    const far = height * 2;
    const parts = { far };

    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.replaceChildren();

    const defs = node("defs");
    svg.append(defs);

    parts.rock = node("path");
    const rock = node("clipPath", { id: "cs-rock" });
    rock.append(parts.rock);

    parts.footEdge = node("path");
    const footwall = node("clipPath", { id: "cs-footwall" });
    footwall.append(parts.footEdge);

    parts.hangEdge = node("path");
    const hangingwall = node("clipPath", { id: "cs-hangingwall" });
    hangingwall.append(parts.hangEdge);

    defs.append(rock, footwall, hangingwall);

    // the layered stack, built once per wall, then drawn on each side of the
    // fault with the hanging wall dropped, which is what makes the fault
    // legible as a normal fault
    const stack = (index) => {
      const group = node("g", { class: "strata" });
      const bands = [];
      for (let i = 0; i < m.count; i++) {
        const band = node("path", { class: `unit unit-${i + 1}` });
        bands.push(band);
        group.append(band);
      }

      const basement = node("path", { class: "basement" });
      group.append(basement);

      // bed contacts, drawn over the fills so they stay crisp
      const contacts = [];
      for (let i = 1; i <= m.count; i++) {
        const contact = node("path", { class: "contact" });
        contacts.push(contact);
        group.append(contact);
      }

      const fractures = node("g", { class: "fractures" });
      group.append(fractures);

      return { index, group, bands, basement, contacts, fractures };
    };

    parts.stacks = [stack(0), stack(1)];

    // the sweep animation in the stylesheet sets clip-path, and a CSS
    // clip-path beats the clip-path attribute, so the group that gets swept
    // has to be a wrapper around the group that gets eroded
    const sweep = node("g", { class: "sweep" });
    parts.body = node("g", { id: "cs-body", "clip-path": "url(#cs-rock)" });

    const foot = node("g", { "clip-path": "url(#cs-footwall)" });
    foot.append(parts.stacks[0].group);

    const hanging = node("g", { "clip-path": "url(#cs-hangingwall)" });
    parts.dropped = node("g");
    parts.dropped.append(parts.stacks[1].group);
    hanging.append(parts.dropped);

    parts.fault = node("path", { class: "fault" });
    parts.body.append(foot, hanging, parts.fault);
    sweep.append(parts.body);
    svg.append(sweep);

    parts.topo = node("path", { class: "topo" });
    svg.append(parts.topo);

    parts.marks = node("g", { class: "marks" });
    parts.slipMarks = [node("g", { class: "slip" }), node("g", { class: "slip" })];
    parts.faultLabel = node("text", { class: "annotation" });
    parts.axis = node("path", { class: "axis" });
    parts.axisLabel = node("text", { class: "annotation", "text-anchor": "middle" });
    parts.axisLabel.textContent = "anticline axis";
    parts.marks.append(
      ...parts.slipMarks,
      parts.faultLabel,
      parts.axis,
      parts.axisLabel
    );

    // scale bar, rounded to something a survey would actually print. On a
    // narrow sheet there is no room for it beside the note, so it is left off
    if (width > 640) {
      const barMetres = width * SCALE > 2400 ? 1000 : 500;
      const barWidth = barMetres / SCALE;
      const barX = width - barWidth - 28;
      const barY = height - 30;
      const bar = node("g", { class: "scale-bar" });

      for (let i = 0; i < 4; i++)
        bar.append(
          node("rect", {
            x: (barX + (i * barWidth) / 4).toFixed(1),
            y: barY,
            width: (barWidth / 4).toFixed(1),
            height: 5,
            class: i % 2 ? "on" : "off",
          })
        );

      const barLabel = node("text", {
        class: "annotation",
        x: (barX + barWidth).toFixed(1),
        y: barY - 8,
        "text-anchor": "end",
      });
      barLabel.textContent = `${barMetres} m · no vertical exaggeration`;
      bar.append(barLabel);
      parts.marks.append(bar);
    }

    svg.append(parts.marks);

    // anything drawn on top of the section rather than in it
    parts.overlay = node("g", { class: "overlay" });
    svg.append(parts.overlay);

    return parts;
  };

  const paintStack = (m, stack) => {
    const { width, height, count } = m;
    const far = height * 2;

    for (let i = 0; i < count; i++) {
      const top =
        i === 0
          ? sample(width, (x) => boundaryAt(m, 0, x) - far)
          : sample(width, (x) => boundaryAt(m, i, x));
      const bottom = sample(width, (x) => boundaryAt(m, i + 1, x));
      stack.bands[i].setAttribute(
        "d",
        `${path(top)} ${path(bottom.reverse()).replace("M", "L")} Z`
      );
    }

    stack.basement.setAttribute(
      "d",
      path(
        [
          ...sample(width, (x) => boundaryAt(m, count, x)),
          [width + 20, height + far],
          [-20, height + far],
        ],
        " Z"
      )
    );

    for (let i = 1; i <= count; i++)
      stack.contacts[i - 1].setAttribute(
        "d",
        path(sample(width, (x) => boundaryAt(m, i, x)))
      );

    const cracks = m.swarms[stack.index];
    const drawn = stack.fractures.children;
    cracks.forEach((crack, i) => {
      const top = boundaryAt(m, crack.unit, crack.x);
      const base = boundaryAt(m, crack.unit + 1, crack.x);
      const y = top + crack.through * (base - top);
      const dx = (Math.cos(crack.angle) * crack.length) / 2;
      const dy = (Math.sin(crack.angle) * crack.length) / 2;
      const line = drawn[i] || stack.fractures.appendChild(node("line"));
      line.setAttribute("x1", (crack.x - dx).toFixed(1));
      line.setAttribute("y1", (y - dy).toFixed(1));
      line.setAttribute("x2", (crack.x + dx).toFixed(1));
      line.setAttribute("y2", (y + dy).toFixed(1));
    });
    while (stack.fractures.children.length > cracks.length)
      stack.fractures.lastElementChild.remove();

    // fractures are something that happened to the rock, so restoring it
    // takes them away again
    stack.fractures.setAttribute("opacity", m.strain.toFixed(2));
  };

  const paint = (m, parts) => {
    const { width, height } = m;
    const far = parts.far;

    parts.rock.setAttribute(
      "d",
      path(
        [
          ...sample(width, (x) => topoAt(m, x)),
          [width + 20, height + far],
          [-20, height + far],
        ],
        " Z"
      )
    );

    // everything on one side of the fault plane, out to well past the frame
    const side = (sign) => {
      const edge = sign > 0 ? width + far : -far;
      return path(
        [
          [edge, -far],
          [faultAt(m, -far), -far],
          [faultAt(m, height + far), height + far],
          [edge, height + far],
        ],
        " Z"
      );
    };

    parts.footEdge.setAttribute("d", side(-m.hangingSign));
    parts.hangEdge.setAttribute("d", side(m.hangingSign));

    parts.stacks.forEach((stack) => paintStack(m, stack));

    parts.dropped.setAttribute(
      "transform",
      `translate(0 ${throwAt(m).toFixed(1)})`
    );

    parts.fault.setAttribute(
      "d",
      path([
        [faultAt(m, -far), -far],
        [faultAt(m, height + far), height + far],
      ])
    );

    // a fault is only there while it has something to show for itself, so it
    // fades out as the last of the throw is taken back off it
    const moved = Math.min(1, throwAt(m) / Math.max(m.throwDistance, 1) / 0.35);
    parts.fault.setAttribute("opacity", moved.toFixed(2));

    parts.topo.setAttribute("d", path(sample(width, (x) => topoAt(m, x), 4)));

    // sense of slip, an arrow down on the hanging wall and up on the footwall
    const slipY = topoAt(m, faultAt(m, m.topoBase)) + height * 0.16;
    const slipX = faultAt(m, slipY);
    const arrow = (x, direction) => {
      const size = 13;
      const tip = slipY + (size * direction) / 2;
      return [
        node("line", {
          x1: x,
          y1: slipY - (size * direction) / 2,
          x2: x,
          y2: tip,
        }),
        node("path", {
          d:
            `M${(x - 3.2).toFixed(1)} ${(tip - 4 * direction).toFixed(1)} ` +
            `L${x.toFixed(1)} ${tip.toFixed(1)} ` +
            `L${(x + 3.2).toFixed(1)} ${(tip - 4 * direction).toFixed(1)}`,
        }),
      ];
    };
    parts.slipMarks[0].replaceChildren(...arrow(slipX - 14, -m.hangingSign));
    parts.slipMarks[1].replaceChildren(...arrow(slipX + 14, m.hangingSign));
    parts.slipMarks.forEach((group) =>
      group.setAttribute("opacity", moved.toFixed(2))
    );

    // the fault label goes in the air just above where the fault reaches the
    // surface, which takes a couple of passes to find because the surface is
    // not flat
    let traceY = m.topoBase;
    let traceX = m.faultX;
    for (let i = 0; i < 4; i++) {
      traceX = faultAt(m, traceY);
      traceY = topoAt(m, traceX);
    }

    const labelSide = traceX > width * 0.55 ? -1 : 1;
    parts.faultLabel.setAttribute("x", (traceX + labelSide * 10).toFixed(1));
    parts.faultLabel.setAttribute("y", (traceY - 14).toFixed(1));
    parts.faultLabel.setAttribute(
      "text-anchor",
      labelSide > 0 ? "start" : "end"
    );
    parts.faultLabel.textContent = `F1 · normal · ${Math.round(
      m.dip
    )}° · throw ${Math.round(throwAt(m) * SCALE)} m`;
    parts.faultLabel.setAttribute("opacity", moved.toFixed(2));

    const crestShown =
      m.crest > width * 0.08 && m.crest < width * 0.92 ? m.strain : 0;
    parts.axis.setAttribute(
      "d",
      path([
        [m.crest, topoAt(m, m.crest) - height * 0.06],
        [m.crest, height],
      ])
    );
    parts.axis.setAttribute("opacity", crestShown.toFixed(2));

    // two labels in the same place read as neither, so the axis goes
    // unlettered when the fault has already claimed that piece of sky
    parts.axisLabel.setAttribute("x", m.crest.toFixed(1));
    parts.axisLabel.setAttribute(
      "y",
      (topoAt(m, m.crest) - height * 0.075).toFixed(1)
    );
    parts.axisLabel.setAttribute(
      "opacity",
      (Math.abs(m.crest - traceX) > 150 ? crestShown : 0).toFixed(2)
    );
  };

  const draw = (svg) => {
    const width = Math.max(svg.clientWidth, 320);
    const height = Math.max(svg.clientHeight, 240);

    const m = grow(width, height);
    const parts = build(svg, m);
    paint(m, parts);

    svg.section = {
      model: m,
      parts,
      width,
      height,
      scale: SCALE,
      paint: () => paint(m, parts),
      topoAt: (x) => topoAt(m, x),
      boundaryAt: (i, x) => boundaryAt(m, i, x),
      faultAt: (y) => faultAt(m, y),
      throwAt: () => throwAt(m),
      unitAt: (x, y) => unitAt(m, x, y),
      body: parts.body,
      overlay: parts.overlay,
    };

    // anything hung off the section has to be hung again once it is regrown
    svg.dispatchEvent(new CustomEvent("cross-section:drawn"));
  };

  const start = () => {
    const svg = document.querySelector(".cross-section");
    if (!svg) return;

    draw(svg);

    // regenerate only when the width really changes, so that the address bar
    // sliding away on a phone does not redraw the section under the reader
    let last = svg.clientWidth;
    let timer;
    window.addEventListener("resize", () => {
      if (Math.abs(svg.clientWidth - last) < 48) return;
      last = svg.clientWidth;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => draw(svg), 200);
    });
  };

  if (document.readyState === "loading")
    window.addEventListener("DOMContentLoaded", start);
  else start();
}
