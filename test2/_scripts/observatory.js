/*
  Two small pieces of page furniture for the fracture-observatory layout.

  1. The depth rail: a fixed scale down the right edge that reads the page the
     way a borehole log reads a hole, with each section heading marked as a top
     and the current depth tracking the scroll position.

  2. Reveal on scroll: sections lift into place once, and only once, so the
     page settles rather than performs.

  Both are inert when the visitor has asked for reduced motion, and the rail
  hides itself on narrow screens through CSS rather than here.
*/

(() => {
  const still = () =>
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const buildRail = () => {
    const rail = document.querySelector(".depth-rail");
    if (!rail) return;

    const sections = [...document.querySelectorAll("main > section")];
    const tops = [];

    for (const section of sections) {
      const heading = section.querySelector("h1, h2");
      if (!heading) continue;
      const label = (heading.textContent || "").trim().replace(/\s+/g, " ");
      if (!label) continue;
      if (!heading.id) {
        heading.id =
          "top-" + label.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
      }
      tops.push({ section, heading, label });
    }

    if (tops.length < 2) return;

    rail.innerHTML =
      '<div class="depth-rail-line"><span class="depth-rail-fill"></span></div>' +
      '<ol class="depth-rail-tops">' +
      tops
        .map(
          (top, index) =>
            '<li class="depth-rail-top" style="--i:' +
            index +
            '"><a href="#' +
            top.heading.id +
            '"><span class="depth-rail-tick"></span><span class="depth-rail-label">' +
            top.label.replace(/&/g, "&amp;").replace(/</g, "&lt;") +
            "</span></a></li>"
        )
        .join("") +
      "</ol>" +
      '<div class="depth-rail-depth"><span class="depth-rail-value">0</span>%</div>';

    const fill = rail.querySelector(".depth-rail-fill");
    const value = rail.querySelector(".depth-rail-value");
    const items = [...rail.querySelectorAll(".depth-rail-top")];

    let queued = false;
    const update = () => {
      queued = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      fill.style.transform = "scaleY(" + progress.toFixed(4) + ")";
      value.textContent = Math.round(progress * 100);

      const line = window.scrollY + window.innerHeight * 0.32;
      let current = 0;
      tops.forEach((top, index) => {
        if (top.section.offsetTop <= line) current = index;
      });
      items.forEach((item, index) =>
        item.classList.toggle("is-current", index === current)
      );
    };

    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    rail.dataset.ready = "yes";
  };

  const buildReveal = () => {
    if (still() || !("IntersectionObserver" in window)) return;

    // whole blocks only. Revealing individual rows staggers them out of
    // alignment with the rules and spines that run between them, and
    // .portrait-wrapper is display:contents, so it has no box to move.
    const targets = document.querySelectorAll("main > section > *");
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.04 }
    );

    // flip the flag before tagging anything, so nothing is briefly styled
    // as revealed and then hidden again
    document.documentElement.dataset.reveal = "on";

    for (const target of targets) {
      target.classList.add("reveal");
      observer.observe(target);
    }
  };

  const boot = () => {
    buildRail();
    buildReveal();
  };

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
