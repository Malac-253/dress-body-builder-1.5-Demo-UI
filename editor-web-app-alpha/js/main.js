// Main.js
import Logger from "./logger.js";
const log = Logger.createLogger("Main");

import Config from "../config/config.js";
import AnimationListController from "./controllers/AnimationListController.js";
import ParametersController from "./controllers/ParametersController.js";
import TimelineController from "./controllers/TimelineController.js";

// NEW: Our new playback controller
import PlaybackController from "./controllers/PlaybackController.js";

log.info("Application started");

document.addEventListener("DOMContentLoaded", () => {
  log.trace("DOM fully loaded, initializing UI...");

  // Instantiate the ParametersController
  const parametersController = new ParametersController();

  // Create a new instance of the AnimationListController with a callback.
  // Pass the full animation object to load its parameters.
  const animationController = new AnimationListController(
    "animationItems",  // Container for the animation list
    "animationSearch", // The search input element ID
    (selectedAnimation) => {
      log.info("Selected animation from list:", selectedAnimation);
      parametersController.loadParameters(selectedAnimation);
    }
  );

  // Initialize the TimelineController, which sets up an empty timeline and debugging.
  const timelineController = new TimelineController();

  // NEW: Create a PlaybackController to handle Play/Pause/Jump
  const playbackController = new PlaybackController(timelineController);

  // Wire the apply button in parameters to add the animation to the timeline.
  parametersController.setTimelineAddCallback(
    timelineController.handleAddAnimation.bind(timelineController)
  );
  // Also wire update callback for editing.
  parametersController.onUpdateTimelineBlock =
    timelineController.handleBlockUpdate.bind(timelineController);

  // Wire timeline view callbacks:
  // Replace direct parameter loading with block editing workflow.
  timelineController.view.onBlockSelect = timelineController.handleBlockEdit.bind(timelineController);

  // When a block is edited, load its parameters.
  timelineController.onBlockEdit = (block) => {
    log.info("onBlockEdit callback triggered with block", block);
    parametersController.loadParameters(block);
  };

  timelineController.view.onBlockUpdate = () => {
    timelineController.view.renderTimeline(timelineController.model.getTimeline());
  };
  timelineController.view.onBlockMove = timelineController.handleBlockMove.bind(timelineController);

  // For Delete: hooking up setDeleteCallback
  parametersController.setDeleteCallback = function(callback) {
    parametersController.view.setDeleteCallback(callback);
  };
  parametersController.setDeleteCallback((animationId) => {
    timelineController.model.removeBlockById(animationId);
    timelineController.view.renderTimeline(timelineController.model.getTimeline());
    parametersController.view.container.innerHTML = "";
  });

  // NEW: Hook up the playback buttons from your HTML:
  const btnJumpStart  = document.getElementById("btnJumpStart");
  const btnBack10     = document.getElementById("btnBack10");
  const btnRewind     = document.getElementById("btnRewind");
  const btnPlay       = document.getElementById("btnPlay");
  const btnPause      = document.getElementById("btnPause");
  const btnForward    = document.getElementById("btnForward");
  const btnForward10  = document.getElementById("btnForward10");
  const btnJumpEnd    = document.getElementById("btnJumpEnd");
  const currentTimeEl = document.getElementById("currentTime");

  // If these elements exist, wire them up
  if (btnPlay && btnPause) {
    // Normal Play
    btnPlay.addEventListener("click", () => {
      playbackController.play();
      btnPlay.style.display = "none";
      btnPause.style.display = "inline-block";
    });
    // Pause
    btnPause.addEventListener("click", () => {
      playbackController.pause();
      btnPause.style.display = "none";
      btnPlay.style.display = "inline-block";
    });
  }

  // Jump to start
  if (btnJumpStart) {
    btnJumpStart.addEventListener("click", () => {
      playbackController.jumpTo(0); // jumps to 0 ms
    });
  }

  // Jump to end
  if (btnJumpEnd) {
    btnJumpEnd.addEventListener("click", () => {
      const endMs = Config.app.totalDuration * 1000; 
      playbackController.jumpTo(endMs);
    });
  }

  // Rewind, Forward - for alpha, these could do small jumps or negative jumps
  if (btnRewind) {
    btnRewind.addEventListener("click", () => {
      // For alpha, let's just jump back 2 seconds
      playbackController.jumpTo(playbackController.currentTime - 2000);
    });
  }
  if (btnForward) {
    btnForward.addEventListener("click", () => {
      // Jump forward 2 seconds
      playbackController.jumpTo(playbackController.currentTime + 2000);
    });
  }

  // -10s
  if (btnBack10) {
    btnBack10.addEventListener("click", () => {
      playbackController.jumpTo(playbackController.currentTime - 10000);
    });
  }
  // +10s
  if (btnForward10) {
    btnForward10.addEventListener("click", () => {
      playbackController.jumpTo(playbackController.currentTime + 10000);
    });
  }

  // OPTIONAL: We can update display of current time
  // For alpha, let's just do a simple setInterval reading the playbackController.currentTime
  // to show in the "currentTimeEl" if it exists
  if (currentTimeEl) {
    setInterval(() => {
      const ms = Math.floor(playbackController.currentTime);
      const secs = Math.floor(ms / 1000) % 60;
      const mins = Math.floor(ms / 60000) % 60;
      const hrs  = Math.floor(ms / 3600000);

      const remainderMs = ms % 1000;
      const timeString = `${String(hrs).padStart(2,"0")}:${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")}.${String(remainderMs).padStart(3,"0")}`;
      currentTimeEl.textContent = timeString;
    }, 200);
  }

  // OPTIONAL: Add a "Copy Timeline" or "Import Timeline" feature
  // if you have a dedicated button in the HTML, e.g. <button id="btnCopyTimeline">...
  // or an <input type="file" id="fileImporter" ...>

  // Example:
  const btnCopyTimeline = document.getElementById("btnCopyTimeline");
  if (btnCopyTimeline) {
    btnCopyTimeline.addEventListener("click", () => {
      const timelineData = timelineController.model.getTimeline();
      const jsonStr = JSON.stringify(timelineData, null, 2);
      navigator.clipboard.writeText(jsonStr)
        .then(() => alert("Copied timeline JSON to clipboard!"))
        .catch(err => console.error("Clipboard error:", err));
    });
  }

  const fileImporter = document.getElementById("fileImporter");
  if (fileImporter) {
    fileImporter.addEventListener("change", (evt) => {
      const file = evt.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          timelineController.model.setTimeline(parsed);
          timelineController.view.renderTimeline(parsed);
          console.info("Timeline imported successfully!");
        } catch (ex) {
          console.error("Error parsing JSON:", ex);
        }
      };
      reader.readAsText(file);
    });
  }

});
