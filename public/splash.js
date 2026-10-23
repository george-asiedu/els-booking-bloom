// Runs before the app: apply the saved theme (no flash of the wrong
// one), and brand the loading screen. A studio's name, logo and colour
// are remembered from the last visit to this address (src/lib/splash.ts
// saves them); with nothing saved, the platform's own address shows the
// Zuri mark and a studio address shows just the progress line.
(function () {
  var root = document.documentElement;
  try {
    var theme = localStorage.getItem("theme");
    if (!theme) theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    root.classList.add(theme);
  } catch (e) {}

  var splash = document.getElementById("splash");
  var mark = document.getElementById("splash-mark");
  var nameEl = document.getElementById("splash-name");
  // The platform's own pages (console, landing, signup, studio sign-in,
  // legal) are always Zuri's, even when a studio was last opened on this
  // address (locally, or after "Enter dashboard" from the console).
  var platformPage = /^\/(platform|welcome|onboarding|studio-login|privacy|terms)(\/|$)/.test(
    location.pathname,
  );
  var studio = null;
  if (!platformPage) {
    try {
      studio = JSON.parse(localStorage.getItem("zuri_splash:" + location.host) || "null");
    } catch (e) {}
  }

  var labels = location.hostname.split(".");
  var looksLikePlatform =
    platformPage ||
    location.hostname === "localhost" ||
    labels.length <= 2 ||
    labels[0] === "www";

  if (studio && studio.name) {
    nameEl.textContent = studio.name;
    document.title = studio.name;
    if (studio.primaryColor) splash.style.setProperty("--splash-accent", studio.primaryColor);
    if (studio.logoUrl) {
      var img = document.createElement("img");
      img.src = studio.logoUrl;
      img.alt = "";
      mark.appendChild(img);
    }
    // No logo: show just the name, never a made-up mark.
  } else if (looksLikePlatform) {
    mark.className += " splash-plain";
    var zuri = document.createElement("img");
    zuri.src = "/zuri-mark.png";
    zuri.alt = "";
    mark.appendChild(zuri);
    nameEl.textContent = "Zuri Studios";
  }

  window.__hideSplash = function () {
    if (!splash || splash.classList.contains("splash-hide")) return;
    splash.classList.add("splash-hide");
    setTimeout(function () {
      if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
    }, 400);
  };
  // Never let the loading screen outstay a slow network or an error.
  setTimeout(window.__hideSplash, 8000);
})();
