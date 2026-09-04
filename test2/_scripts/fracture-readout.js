/*
  Reports the fracture network that fracture-field.js grew.

  Two consumers:
    [data-readout="..."]  small numeric fields in the hero strip
    .rose                 an orientation rose diagram, length-weighted

  Both are filled from the same network object, so what the page claims about
  the background is actually measured from it rather than written by hand.
*/

{
  const BINS = 18; // 10 degrees per petal, mirrored to a full circle

  const format = (key, stats) => {
    switch (key) {
      case "traces":
        return String(stats.traces);
      case "nodes":
        return String(stats.nodes);
      case "p21":
        return stats.p21.toFixed(2);
      case "sets":
        return (
          bearing(stats.setOne) + " / " + bearing(stats.setTwo)
        );
      case "span":
        return stats.spanM + " m";
      default:
        return "";
    }
  };

  // screen angle (clockwise from east, y down) read as a map bearing
  const bearing = (deg) => {
    const b = ((90 + deg) % 180 + 180) % 180;
    return String(Math.round(b)).padStart(3, "0") + "°";
  };

  const countUp = (el, target) => {
    const numeric = Number(target);
    if (!Number.isFinite(numeric) || numeric === 0) {
      el.textContent = target;
      return;
    }
    const decimals = target.includes(".") ? target.split(".")[1].length : 0;
    const started = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - started) / 1400);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (numeric * eased).toFixed(decimals);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const fillReadouts = (stats) => {
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    for (const el of document.querySelectorAll("[data-readout]")) {
      const value = format(el.dataset.readout, stats);
      if (!value) continue;
      if (still || el.dataset.filled === "yes") el.textContent = value;
      else countUp(el, value);
      el.dataset.filled = "yes";
    }
  };

  const drawRose = (svg, net) => {
    const petals = new Array(BINS).fill(0);
    for (const trace of net.traces) {
      const bin = Math.floor((trace.orientation / 180) * BINS) % BINS;
      petals[bin] += trace.length;
    }
    const peak = Math.max(...petals, 1);

    const size = 200;
    const mid = size / 2;
    const radius = mid - 26;
    const parts = [];

    // graticule: three rings and the cardinal ticks
    for (const frac of [0.34, 0.67, 1]) {
      parts.push(
        `<circle cx="${mid}" cy="${mid}" r="${(radius * frac).toFixed(1)}" class="rose-ring"/>`
      );
    }
    for (let a = 0; a < 180; a += 30) {
      const rad = ((a - 90) * Math.PI) / 180;
      const x1 = mid + Math.cos(rad) * radius;
      const y1 = mid + Math.sin(rad) * radius;
      const x2 = mid - Math.cos(rad) * radius;
      const y2 = mid - Math.sin(rad) * radius;
      parts.push(
        `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="rose-spoke"/>`
      );
    }

    // petals, drawn both ways round because a fracture trace has no sense
    const wedge = 180 / BINS;
    petals.forEach((value, index) => {
      const r = (value / peak) * radius;
      if (r < 0.5) return;
      const a0 = index * wedge - 90;
      const a1 = a0 + wedge;
      for (const flip of [0, 180]) {
        const p0 = ((a0 + flip) * Math.PI) / 180;
        const p1 = ((a1 + flip) * Math.PI) / 180;
        const x0 = mid + Math.cos(p0) * r;
        const y0 = mid + Math.sin(p0) * r;
        const x1 = mid + Math.cos(p1) * r;
        const y1 = mid + Math.sin(p1) * r;
        parts.push(
          `<path d="M${mid} ${mid} L${x0.toFixed(1)} ${y0.toFixed(1)} A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z" class="rose-petal" style="--i:${index}"/>`
        );
      }
    });

    for (const [label, x, y] of [
      ["N", mid, 12],
      ["E", size - 8, mid + 4],
      ["S", mid, size - 4],
      ["W", 8, mid + 4],
    ]) {
      parts.push(
        `<text x="${x}" y="${y}" class="rose-label" text-anchor="middle">${label}</text>`
      );
    }

    svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
    svg.innerHTML = parts.join("");
  };

  const apply = (net) => {
    fillReadouts(net.stats);
    for (const svg of document.querySelectorAll(".rose")) drawRose(svg, net);
  };

  document.addEventListener("fracture-field", (event) => apply(event.detail));

  // the field may have finished before this script ran
  window.addEventListener("load", () => {
    const net = window.fractureNetwork?.();
    if (net) apply(net);
  });
}
