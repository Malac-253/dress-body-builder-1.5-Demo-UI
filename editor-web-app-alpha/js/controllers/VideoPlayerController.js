// VideoPlayerController.js
import Logger from "../logger.js";
import VideoPlayerModel from "../models/VideoPlayerModel.js";
import VideoPlayerView from "../views/VideoPlayerView.js";
import JinjaInvoker from "./JinjaInvoker.js";

const log = Logger.createLogger("VideoPlayerController");

class VideoPlayerController {
  constructor(timelineController) {
    this.timelineController = timelineController;
    this.model = new VideoPlayerModel();
    this.view = new VideoPlayerView();

    // If you want to handle a "Play" button or "GenerateFrames" button, you can do it here.
    const btnGenerate = document.getElementById("btnGenerateFrames");
    if (btnGenerate) {
      btnGenerate.addEventListener("click", () => this.generateFramesNaive());
    }
  }

  /**
   * generateFramesNaive: re-run the entire timeline from 0 to end, calling
   * jinja templates for each block, capturing frames in the previewSVG, etc.
   */
  generateFramesNaive() {
    // If not "dirty," skip. But let's do a forced approach for now:
    if (!this.timelineController.isDirty) {
      log.info("Timeline not dirty – using existing frames. (But forcing re-gen for demonstration.)");
      // return;
    }

    log.info("Naively generating frames from timeline...");

    // 1) Clear existing frames & re-init preview
    this.model.reset();
    this.reinitPreviewSVG();

    // 2) Gather blocks in chronological order
    const timeline = this.timelineController.model.getTimeline();
    const allBlocks = [];
    timeline.tracks.forEach(track => {
      track.forEach(block => { allBlocks.push(block); });
    });
    allBlocks.sort((a, b) => a.time.start - b.time.start);

    // 3) Step through blocks
    allBlocks.forEach(block => {
      // If there's a jinjaTemplate, call it
      if (block.data.jinjaTemplate) {
        JinjaInvoker.invoke(block.data.jinjaTemplate, block.data.parameters);
      }
      // else if you have an older approach, do block conversions
      // Possibly call myLibrary.* etc.

      // Then capture "frame"
      const snapshot = this.getPreviewSnapshot();
      this.model.addFrame(snapshot);
    });

    // 4) Render final or first frame as demonstration
    if (this.model.frames.length > 0) {
      this.view.renderFrame(this.model.frames[this.model.frames.length - 1]);
    }

    // Mark timeline clean
    this.timelineController.isDirty = false;
  }

  reinitPreviewSVG() {
    const svgEl = document.getElementById("previewSVG");
    if (svgEl) {
      svgEl.innerHTML = ""; // or replace with a fresh clone
    }
  }

  getPreviewSnapshot() {
    const svgEl = document.getElementById("previewSVG");
    if (!svgEl) {
      return "<svg>No preview found</svg>";
    }
    return svgEl.outerHTML;
  }
}

export default VideoPlayerController;