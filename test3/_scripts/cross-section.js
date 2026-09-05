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

  const draw = (svg) => {
    const width = Math.max(svg.clientWidth, 320);
    const height = Math.max(svg.clientHeight, 240);

    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.replaceChildren();

    const defs = node("defs");
    svg.append(defs);

    // --- structure -------------------------------------------------------

    // folding, as a long wave with a shorter one riding on it and a regional
    // tilt, applied to every boundary alike so the beds stay parallel
    const wave = rand(0.55, 1.05) * width;
    const phase = rand(0, wave);
    const amp = height * rand(0.05, 0.1);
    const wave2 = rand(0.16, 0.3) * width;
    const phase2 = rand(0, wave2);
    const amp2 = height * rand(0.012, 0.028);
    const tilt = rand(-0.09, 0.09);

    const fold = (x) =>
      amp * Math.sin((2 * Math.PI * (x + phase)) / wave) +
      amp2 * Math.sin((2 * Math.PI * (x + phase2)) / wave2) +
      tilt * (x - width / 2);

    // the land surface follows the structure a little, the way a fold belt
    // weathers into ridges and valleys, but not slavishly
    const relief = height * rand(0.03, 0.06);
    const topoWave = rand(0.3, 0.5) * width;
    const topoPhase = rand(0, topoWave);
    const topoBase = height * rand(0.26, 0.34);
    const topo = (x) =>
      topoBase -
      0.3 * fold(x) +
      relief * Math.sin((2 * Math.PI * (x + topoPhase)) / topoWave) +
      relief * 0.35 * Math.sin((2 * Math.PI * (x + topoPhase * 3)) / (topoWave / 2.7));

    // six conformable units over a basement
    const count = 6;
    const thickness = [];
    for (let i = 0; i < count; i++) thickness.push(height * rand(0.075, 0.135));

    const boundary = [];
    let depth = topoBase + height * rand(0.02, 0.09);
    for (let i = 0; i <= count; i++) {
      const at = depth;
      boundary.push((x) => at + fold(x));
      depth += thickness[i] ?? 0;
    }

    // one fault, dipping steeply, cutting the whole section
    const dip = rand(58, 76);
    const facing = pick([-1, 1]);
    const cot = facing / Math.tan((dip * Math.PI) / 180);
    const faultX = rand(0.3, 0.7) * width;
    const throwDistance = height * rand(0.06, 0.13);
    const faultAt = (y) => faultX + (y - topoBase) * cot;

    // --- clip regions ----------------------------------------------------

    const far = height * 2;

    const rock = node("clipPath", { id: "cs-rock" });
    rock.append(
      node("path", {
        d: path([
          ...sample(width, topo),
          [width + 20, height + far],
          [-20, height + far],
        ], " Z"),
      })
    );

    // everything on one side of the fault plane, out to well past the frame
    const side = (sign) => {
      const edge = sign > 0 ? width + far : -far;
      return path(
        [
          [edge, -far],
          [faultAt(-far), -far],
          [faultAt(height + far), height + far],
          [edge, height + far],
        ],
        " Z"
      );
    };

    // a fault dipping to the right hangs its hanging wall on the right
    const hangingSign = facing > 0 ? 1 : -1;

    const footwall = node("clipPath", { id: "cs-footwall" });
    footwall.append(node("path", { d: side(-hangingSign) }));
    const hangingwall = node("clipPath", { id: "cs-hangingwall" });
    hangingwall.append(node("path", { d: side(hangingSign) }));

    defs.append(rock, footwall, hangingwall);

    // --- the layered stack ------------------------------------------------

    // built once, then drawn on each side of the fault with the hanging wall
    // dropped, which is what makes the fault legible as a normal fault
    const stack = () => {
      const group = node("g", { class: "strata" });

      for (let i = 0; i < count; i++) {
        const top = i === 0 ? (x) => boundary[0](x) - far : boundary[i];
        const bottom = boundary[i + 1];
        const band = node("path", {
          class: `unit unit-${i + 1}`,
          d:
            path(sample(width, top)) +
            " " +
            path(sample(width, bottom).reverse()).replace("M", "L") +
            " Z",
        });
        group.append(band);
      }

      // basement below the youngest six units
      group.append(
        node("path", {
          class: "basement",
          d: path([
            ...sample(width, boundary[count]),
            [width + 20, height + far],
            [-20, height + far],
          ], " Z"),
        })
      );

      // bed contacts, drawn over the fills so they stay crisp
      for (let i = 1; i <= count; i++)
        group.append(
          node("path", { class: "contact", d: path(sample(width, boundary[i])) })
        );

      // fracture swarms: two conjugate sets, in the units this group would
      // actually map them in
      const swarm = node("g", { class: "fractures" });
      const setA = rand(58, 74);
      const setB = -rand(58, 74);
      for (let i = 0; i < Math.round(width / 14); i++) {
        const x = rand(0, width);
        const unit = Math.floor(rand(1, 4));
        const top = boundary[unit](x);
        const base = boundary[unit + 1](x);
        if (base - top < 12) continue;
        const y = rand(top + 3, base - 3);
        const angle = ((Math.random() < 0.5 ? setA : setB) * Math.PI) / 180;
        const length = rand(6, Math.min(22, (base - top) * 0.8));
        const dx = (Math.cos(angle) * length) / 2;
        const dy = (Math.sin(angle) * length) / 2;
        swarm.append(
          node("line", {
            x1: (x - dx).toFixed(1),
            y1: (y - dy).toFixed(1),
            x2: (x + dx).toFixed(1),
            y2: (y + dy).toFixed(1),
          })
        );
      }
      group.append(swarm);

      return group;
    };

    // the sweep animation in the stylesheet sets clip-path, and a CSS
    // clip-path beats the clip-path attribute, so the group that gets swept
    // has to be a wrapper around the group that gets eroded
    const sweep = node("g", { class: "sweep" });
    const section = node("g", { "clip-path": "url(#cs-rock)" });

    const foot = node("g", { "clip-path": "url(#cs-footwall)" });
    foot.append(stack());

    const hanging = node("g", { "clip-path": "url(#cs-hangingwall)" });
    const dropped = node("g", {
      transform: `translate(0 ${throwDistance.toFixed(1)})`,
    });
    dropped.append(stack());
    hanging.append(dropped);

    section.append(foot, hanging);

    // the fault itself
    section.append(
      node("path", {
        class: "fault",
        d: path([
          [faultAt(-far), -far],
          [faultAt(height + far), height + far],
        ]),
      })
    );

    sweep.append(section);
    svg.append(sweep);

    // --- surface and annotation -------------------------------------------

    svg.append(node("path", { class: "topo", d: path(sample(width, topo, 4)) }));

    const marks = node("g", { class: "marks" });

    // sense of slip, an arrow down on the hanging wall and up on the footwall
    const slipY = topo(faultAt(topoBase)) + height * 0.16;
    const slipX = faultAt(slipY);
    const arrow = (dx, direction) => {
      const x = slipX + dx;
      const y = slipY;
      const size = 13;
      const g = node("g", { class: "slip" });
      g.append(
        node("line", { x1: x, y1: y - (size * direction) / 2, x2: x, y2: y + (size * direction) / 2 })
      );
      g.append(
        node("path", {
          d: `M${x - 3.2} ${y + (size * direction) / 2 - 4 * direction} L${x} ${
            y + (size * direction) / 2
          } L${x + 3.2} ${y + (size * direction) / 2 - 4 * direction}`,
        })
      );
      return g;
    };
    marks.append(arrow(-14, -hangingSign), arrow(14, hangingSign));

    // the fault label goes in the air just above where the fault reaches the
    // surface, which takes a couple of passes to find because the surface is
    // not flat
    let traceY = topoBase;
    let traceX = faultX;
    for (let i = 0; i < 4; i++) {
      traceX = faultAt(traceY);
      traceY = topo(traceX);
    }

    const labelSide = traceX > width * 0.55 ? -1 : 1;
    const faultLabel = node("text", {
      class: "annotation",
      x: (traceX + labelSide * 10).toFixed(1),
      y: (traceY - 14).toFixed(1),
      "text-anchor": labelSide > 0 ? "start" : "end",
    });
    faultLabel.textContent = `F1 · normal · ${Math.round(dip)}° · throw ${Math.round(
      throwDistance * SCALE
    )} m`;
    marks.append(faultLabel);

    // the axis of the fold that happens to sit in view
    let crest = 0;
    for (let x = 0; x <= width; x += 6) if (fold(x) < fold(crest)) crest = x;
    if (crest > width * 0.08 && crest < width * 0.92) {
      marks.append(
        node("path", {
          class: "axis",
          d: path([
            [crest, topo(crest) - height * 0.06],
            [crest, height],
          ]),
        })
      );
      // two labels in the same place read as neither, so the axis goes
      // unlettered when the fault has already claimed that piece of sky
      if (Math.abs(crest - traceX) > 150) {
        const axisLabel = node("text", {
          class: "annotation",
          x: crest.toFixed(1),
          y: (topo(crest) - height * 0.075).toFixed(1),
          "text-anchor": "middle",
        });
        axisLabel.textContent = "anticline axis";
        marks.append(axisLabel);
      }
    }

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
      marks.append(bar);
    }

    svg.append(marks);
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
