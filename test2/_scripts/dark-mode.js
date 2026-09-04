/*
  manages light/dark mode.
*/

{
  // immediately load saved (or default) mode before page renders
  // an explicit choice always wins; with none stored, follow the operating system
  document.documentElement.dataset.dark =
    window.localStorage.getItem("dark-mode") ??
    (window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "true"
      : "false");

  const onLoad = () => {
    // update toggle button to match loaded mode
    document.querySelector(".dark-toggle").checked =
      document.documentElement.dataset.dark === "true";
  };

  // after page loads
  window.addEventListener("load", onLoad);

  // when user toggles mode button
  window.onDarkToggleChange = (event) => {
    const value = event.target.checked;
    document.documentElement.dataset.dark = value;
    window.localStorage.setItem("dark-mode", value);
  };
}
