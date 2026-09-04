// Shows the north arrow once the reader has left the top of the sheet, and
// takes them back up when it is pressed.

{
  // far enough down that the arrow does not flicker in and out under the
  // title block
  const THRESHOLD = 260;

  const start = () => {
    const button = document.querySelector(".to-top");
    if (!button) return;

    let queued = false;

    const mark = () => {
      queued = false;
      button.dataset.shown = window.scrollY > THRESHOLD;
    };

    const onScroll = () => {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(mark);
    };

    button.addEventListener("click", () =>
      window.scrollTo({
        top: 0,
        behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      })
    );

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    mark();
  };

  window.addEventListener("load", start);
}
