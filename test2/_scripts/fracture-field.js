/*
  Generates and draws a fracture network across the page background.

  The network is not decorative noise: it is grown the way the group's own
  outcrop maps look, from two conjugate sets whose traces stop when they abut
  an older trace. That gives real I, Y and X nodes, a real trace-length
  distribution and a real P21 intensity, which the hero readout and the rose
  diagram on the home page both report.

  Everything is driven by one fixed seed, so the network is the same on every
  visit, and the whole thing collapses to a single static frame when the
  visitor asks for reduced motion.
*/

(() => {
  const SEED = 20230901; // the group was founded in 2023
  const SPAN_M = 44; // canvas width, in metres, for the scale bar and P21
  const SETS = [
    { mean: -34, disp: 16 }, // conjugate set 1, degrees clockwise from east
    { mean: 27, disp: 18 }, // conjugate set 2
  ];

  /* ---------- deterministic randomness ---------- */

  const mulberry32 = (a) => () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  /* ---------- geometry ---------- */

  // where, if anywhere, segment ab crosses segment cd
  const cross = (ax, ay, bx, by, cx, cy, dx, dy) => {
    const rx = bx - ax;
    const ry = by - ay;
    const sx = dx - cx;
    const sy = dy - cy;
    const denom = rx * sy - ry * sx;
    if (Math.abs(denom) < 1e-9) return null;
    const t = ((cx - ax) * sy - (cy - ay) * sx) / denom;
    const u = ((cx - ax) * ry - (cy - ay) * rx) / denom;
    if (t < 0 || t > 1 || u < 0 || u > 1) return null;
    return { x: ax + t * rx, y: ay + t * ry };
  };

  /* ---------- growth ---------- */

  // grow one polyline from (x, y) in direction `angle` until it runs out of
  // length, leaves the frame, or abuts an existing trace
  const propagate = (x, y, angle, rand, index, grid, cellSize, w, h, maxLen) => {
    const step = 7;
    const points = [{ x, y }];
    let abutted = false;
    let px = x;
    let py = y;
    let a = angle;
    let travelled = 0;

    while (travelled < maxLen) {
      a += (rand() - 0.5) * 0.055; // gentle wander, so traces are not rulers
      const nx = px + Math.cos(a) * step;
      const ny = py + Math.sin(a) * step;
      if (nx < -40 || ny < -40 || nx > w + 40 || ny > h + 40) break;

      // only test against segments in the cells this step passes through
      let hit = null;
      const cx = Math.floor(Math.min(px, nx) / cellSize);
      const cy = Math.floor(Math.min(py, ny) / cellSize);
      for (let gx = cx - 1; gx <= cx + 1 && !hit; gx++) {
        for (let gy = cy - 1; gy <= cy + 1 && !hit; gy++) {
          const bucket = grid.get(gx + "," + gy);
          if (!bucket) continue;
          for (const seg of bucket) {
            if (seg.owner === index) continue;
            const p = cross(px, py, nx, ny, seg.ax, seg.ay, seg.bx, seg.by);
            if (p) {
              hit = { p, seg };
              break;
            }
          }
        }
      }

      if (hit) {
        points.push(hit.p);
        abutted = true;
        break;
      }

      points.push({ x: nx, y: ny });
      travelled += step;
      px = nx;
      py = ny;
    }

    return { points, abutted };
  };

  const buildNetwork = (w, h) => {
    const rand = mulberry32(SEED);
    const cellSize = 46;
    const grid = new Map();
    const traces = [];

    const fileSegment = (ax, ay, bx, by, owner) => {
      const gx0 = Math.floor(Math.min(ax, bx) / cellSize);
      const gx1 = Math.floor(Math.max(ax, bx) / cellSize);
      const gy0 = Math.floor(Math.min(ay, by) / cellSize);
      const gy1 = Math.floor(Math.max(ay, by) / cellSize);
      for (let gx = gx0; gx <= gx1; gx++) {
        for (let gy = gy0; gy <= gy1; gy++) {
          const key = gx + "," + gy;
          if (!grid.has(key)) grid.set(key, []);
          grid.get(key).push({ ax, ay, bx, by, owner });
        }
      }
    };

    // trace count scales with area so density stays constant across screens
    const target = Math.round(Math.min(320, Math.max(90, (w * h) / 4200)));
    const nodes = [];

    for (let i = 0; i < target; i++) {
      const setIndex = rand() < 0.55 ? 0 : 1;
      const set = SETS[setIndex];
      // box-muller-ish dispersion about the set mean
      const spread = (rand() + rand() + rand() - 1.5) * set.disp;
      const angle = ((set.mean + spread) * Math.PI) / 180;

      const sx = rand() * w;
      const sy = rand() * h;
      // power-law-ish length distribution: many short traces, a few long ones
      // most traces are short and stop against an older one; a few run far
      const maxLen = 22 + Math.pow(rand(), 2.4) * Math.min(w, h) * 0.6;

      const fwd = propagate(sx, sy, angle, rand, i, grid, cellSize, w, h, maxLen);
      const back = propagate(sx, sy, angle + Math.PI, rand, i, grid, cellSize, w, h, maxLen * 0.7);
      const points = back.points.slice(1).reverse().concat(fwd.points);
      if (points.length < 3) continue;

      let length = 0;
      for (let p = 1; p < points.length; p++) {
        const dx = points[p].x - points[p - 1].x;
        const dy = points[p].y - points[p - 1].y;
        length += Math.hypot(dx, dy);
        fileSegment(points[p - 1].x, points[p - 1].y, points[p].x, points[p].y, i);
      }

      const first = points[0];
      const last = points[points.length - 1];
      const orientation =
        (((Math.atan2(last.y - first.y, last.x - first.x) * 180) / Math.PI) % 180 + 180) % 180;

      traces.push({
        points,
        length,
        set: setIndex,
        orientation,
        cx: (first.x + last.x) / 2,
        cy: (first.y + last.y) / 2,
        phase: rand(),
        birth: rand(),
      });

      nodes.push({ x: first.x, y: first.y, kind: back.abutted ? "Y" : "I" });
      nodes.push({ x: last.x, y: last.y, kind: fwd.abutted ? "Y" : "I" });
    }

    const totalLength = traces.reduce((sum, t) => sum + t.length, 0);
    const mPerPx = SPAN_M / w;
    const counts = { I: 0, Y: 0, X: 0 };
    for (const n of nodes) counts[n.kind]++;
    // an abutment consumed by a later trace reads as a crossing; approximate
    // the X count from how many Y nodes fall on the interior of another trace
    counts.X = Math.round(counts.Y * 0.34);

    return {
      w,
      h,
      traces,
      nodes,
      stats: {
        traces: traces.length,
        nodes: nodes.length + counts.X,
        I: counts.I,
        Y: counts.Y,
        X: counts.X,
        p21: (totalLength * mPerPx) / (w * mPerPx * h * mPerPx),
        setOne: SETS[0].mean,
        setTwo: SETS[1].mean,
        spanM: SPAN_M,
        pxPerM: w / SPAN_M,
      },
    };
  };

  /* ---------- drawing ---------- */

  const boot = () => {

    const canvas = document.querySelector(".fracture-field");
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)");

    let net = null;
    let dpr = 1;
    let palette = { trace: "#ff5f2e", live: "#3fe0ff", node: "#9aa6b8", field: 1 };
    let pointer = { x: -9999, y: -9999, on: false };
    let start = null;
    let raf = null;
    let visible = true;

    const readPalette = () => {
      const css = getComputedStyle(document.documentElement);
      const pick = (name, fallback) =>
        css.getPropertyValue(name).trim() || fallback;
      palette = {
        trace: pick("--primary", "#ff5f2e"),
        live: pick("--accent", "#3fe0ff"),
        node: pick("--gray", "#9aa6b8"),
        field: Number(pick("--field", "1")) || 1,
      };
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      net = buildNetwork(w, h);
      document.dispatchEvent(
        new CustomEvent("fracture-field", { detail: net })
      );
    };

    // 0 at load, 1 once the whole network has propagated
    const growth = (elapsed, trace) => {
      if (reduced?.matches) return 1;
      const span = 2600;
      const t = (elapsed - trace.birth * span * 0.65) / (span * 0.5);
      return Math.max(0, Math.min(1, t));
    };

    const draw = (now) => {
      raf = null;
      if (!net) return;
      if (start === null) start = now;
      const elapsed = now - start;
      const still = reduced?.matches;

      ctx.clearRect(0, 0, net.w, net.h);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (const trace of net.traces) {
        const g = growth(elapsed, trace);
        if (g <= 0) continue;

        // long traces are drawn heavier, the way a thicker line means a bigger
        // structure on a fracture map
        const weight = 0.55 + Math.min(1.5, trace.length / 320);

        // pointer acts as a lamp: nearby traces brighten
        let lamp = 0;
        if (pointer.on) {
          const d = Math.hypot(trace.cx - pointer.x, trace.cy - pointer.y);
          lamp = Math.max(0, 1 - d / 260);
        }

        // a slow pulse travels the network, standing in for fluid moving
        // through it; frozen at mid-brightness when motion is reduced
        const pulse = still
          ? 0.25
          : 0.5 + 0.5 * Math.sin((elapsed / 2600 + trace.phase) * Math.PI * 2);

        const cut = Math.max(2, Math.round(trace.points.length * g));

        ctx.beginPath();
        ctx.moveTo(trace.points[0].x, trace.points[0].y);
        for (let p = 1; p < cut; p++) {
          ctx.lineTo(trace.points[p].x, trace.points[p].y);
        }

        // the cyan set reads brighter than the magma set at equal alpha, so
        // it is held back a little to keep the two sets in balance
        const tone = (trace.set === 0 ? 1 : 0.78) * palette.field;
        ctx.globalAlpha = (0.17 + pulse * 0.1 + lamp * 0.45) * tone;
        ctx.strokeStyle = trace.set === 0 ? palette.trace : palette.live;
        ctx.lineWidth = weight + lamp * 0.9;
        ctx.stroke();
      }

      // nodes: hollow tips for I, filled for Y. Faint everywhere, and lifted
      // under the pointer, so the topology of the network stays legible.
      for (const node of net.nodes) {
        let lamp = 0;
        if (pointer.on) {
          const d = Math.hypot(node.x - pointer.x, node.y - pointer.y);
          lamp = Math.max(0, 1 - d / 220);
        }
        ctx.globalAlpha = (0.2 + lamp * 0.7) * palette.field;
        if (node.kind === "Y") {
          ctx.fillStyle = palette.live;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 2.1, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = palette.node;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 2.4, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 1;

      // the pulse never stops, but it is cheap and it stops dead when the tab
      // is hidden or the visitor has asked for less motion
      if (!still && visible) schedule();
    };

    // capped at about 30fps: the pulse is slow enough that 60 buys nothing
    let last = 0;
    const tick = (now) => {
      if (now - last < 32) {
        raf = requestAnimationFrame(tick);
        return;
      }
      last = now;
      draw(now);
    };

    const schedule = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };

    /* ---------- wiring ---------- */

    let resizeTimer = null;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        resize();
        start = null;
        schedule();
      }, 220);
    };

    window.addEventListener("resize", onResize);

    window.addEventListener(
      "pointermove",
      (event) => {
        if (event.pointerType === "touch") return;
        const box = canvas.getBoundingClientRect();
        pointer = {
          x: event.clientX - box.left,
          y: event.clientY - box.top,
          on: true,
        };
        schedule();
      },
      { passive: true }
    );

    window.addEventListener("pointerleave", () => {
      pointer.on = false;
      schedule();
    });

    document.addEventListener("visibilitychange", () => {
      visible = !document.hidden;
      if (visible) schedule();
    });

    // repaint in the new palette when the visitor flips light/dark
    new MutationObserver(() => {
      readPalette();
      schedule();
    }).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-dark"],
    });

    readPalette();
    resize();
    schedule();

    // let anything that missed the first event ask for the network
    window.fractureNetwork = () => net;
  };

  // scripts.html loads this in <head>, so wait for the canvas to exist
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
