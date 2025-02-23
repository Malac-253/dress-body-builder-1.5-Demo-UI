// main.js
import Logger from "./logger.js";

// Optionally import config if you have it
import Config from "../config/config.js";

// If you want to load mocks on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  Logger.trace("DOM fully loaded, initializing UI...");

  // // Dynamically import mock scripts
  // import("../examples/view/mockPopulateAnimationList.js").then((module) => {
  //   module.populateMockAnimationList();
  // });
  // import("../examples/view/mockPopulateParameters.js").then((module) => {
  //   // As an example, auto-load parameters for "SVG Add"
  //   module.populateMockParameters();
  // });

  // Hook up playback buttons
  const btnJumpStart = document.getElementById("btnJumpStart");
  const btnBack10 = document.getElementById("btnBack10");
  const btnRewind = document.getElementById("btnRewind");
  const btnPlay = document.getElementById("btnPlay");
  const btnPause = document.getElementById("btnPause");
  const btnForward = document.getElementById("btnForward");
  const btnForward10 = document.getElementById("btnForward10");
  const btnJumpEnd = document.getElementById("btnJumpEnd");

  btnJumpStart?.addEventListener("click", () => {
    Logger.info("[Playback] Jump to Start (0s)");
    // Move scrubber to 0s
  });
  btnBack10?.addEventListener("click", () => {
    Logger.info("[Playback] -10 seconds");
  });
  btnRewind?.addEventListener("click", () => {
    Logger.info("[Playback] Rewind pressed");
  });
  btnPlay?.addEventListener("click", () => {
    Logger.trace("[Playback] Play button clicked");
    btnPlay.style.display = "none";
    btnPause.style.display = "inline-block";
  });
  btnPause?.addEventListener("click", () => {
    Logger.trace("[Playback] Pause button clicked");
    btnPause.style.display = "none";
    btnPlay.style.display = "inline-block";
  });
  btnForward?.addEventListener("click", () => {
    Logger.info("[Playback] Fast Forward pressed");
  });
  btnForward10?.addEventListener("click", () => {
    Logger.info("[Playback] +10 seconds");
  });
  btnJumpEnd?.addEventListener("click", () => {
    Logger.info("[Playback] Jump to End");
  });

  // Scale slider
  const scaleSlider = document.getElementById("scaleSlider");
  scaleSlider?.addEventListener("input", () => {
    Logger.info("[Timeline] Scale changed:", { value: scaleSlider.value });
  });

  // Animation search
  const animationSearch = document.getElementById("animationSearch");
  animationSearch?.addEventListener("input", () => {
    Logger.info("[Animations] Searching for:", { query: animationSearch.value });
  });

  // Export & sound
  const btnExportMP4 = document.getElementById("btnExportMP4");
  btnExportMP4?.addEventListener("click", () => {
    Logger.warn("[Export] Render to MP4 clicked");
  });

  const btnAddSound = document.getElementById("btnAddSound");
  btnAddSound?.addEventListener("click", () => {
    Logger.warn("[Sound] Add Sound clicked");
  });
});
