document.documentElement.classList.add("js");
// If the main script never runs, reveal everything rather than leave content hidden.
setTimeout(function () {
  if (!window.__ackReady) document.documentElement.classList.add("no-motion");
}, 3000);
