// Builds the legend that runs along the bottom margin of the sheet.
//
// A map sheet explains itself in its legend, so this one lists what is on the
// page: one entry per section heading, in the colour and lithology of the map
// unit that section is washed in, numbered to match the box printed beside the
// heading itself. It doubles as the page's contents, and it marks where the
// reader currently is.

{
  // must match the six unit cycle in _styles/section.scss
  const UNITS = 6;

  const build = () => {
    const main = document.querySelector("main");
    const legend = document.querySelector(".legend");
    if (!main || !legend) return;

    const sections = [...main.children].filter(
      (child) => child.tagName === "SECTION"
    );

    const headings = [...main.querySelectorAll("h2")];
    if (headings.length < 2) return;

    const list = document.createElement("ol");
    list.className = "legend-list";

    const entries = headings.map((heading, index) => {
      const section = heading.closest("section");
      const unit = ((sections.indexOf(section) % UNITS) + UNITS) % UNITS;

      const item = document.createElement("li");
      const link = document.createElement("a");
      link.className = "legend-entry";
      link.href = "#";
      link.dataset.unit = unit + 1;

      const swatch = document.createElement("span");
      swatch.className = "swatch";
      swatch.dataset.pattern = unit + 1;
      swatch.setAttribute("aria-hidden", "true");

      const number = document.createElement("span");
      number.className = "legend-index";
      number.textContent = String(index + 1).padStart(2, "0");

      const name = document.createElement("span");
      name.className = "legend-name";
      // the anchor link the template appends to headings is not part of the name
      name.textContent = heading.textContent.trim();

      link.append(swatch, number, name);
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const offset = document.querySelector("header")?.clientHeight ?? 0;
        window.scrollTo({
          top: heading.getBoundingClientRect().top + window.scrollY - offset - 18,
          behavior: "smooth",
        });
      });

      item.append(link);
      list.append(item);

      return { heading, link };
    });

    const title = document.createElement("span");
    title.className = "legend-title";
    title.textContent = "Legend";

    legend.append(title, list);
    document.body.dataset.legend = "true";

    // --- where the reader is --------------------------------------------

    let queued = false;

    const mark = () => {
      queued = false;

      const offset = (document.querySelector("header")?.clientHeight ?? 0) + 40;
      let current = -1;
      entries.forEach(({ heading }, index) => {
        if (heading.getBoundingClientRect().top <= offset) current = index;
      });

      entries.forEach(({ link }, index) =>
        link.toggleAttribute("data-current", index === current)
      );

      // the legend stays folded away until the reader is into the body of the
      // sheet, so it never covers the section at the top of the homepage
      legend.dataset.shown = current >= 0;

      // keep the current entry in view when the legend has to scroll
      if (current >= 0) {
        const link = entries[current].link;
        const box = link.getBoundingClientRect();
        const frame = legend.getBoundingClientRect();
        if (box.left < frame.left || box.right > frame.right)
          link.scrollIntoView({ block: "nearest", inline: "center" });
      }
    };

    const onScroll = () => {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(mark);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    mark();
  };

  window.addEventListener("load", build);
}
