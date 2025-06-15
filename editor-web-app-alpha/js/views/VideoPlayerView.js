// VideoPlayerView.js
import Logger from "../logger.js";
const log = Logger.createLogger("VideoPlayerView");

class VideoPlayerView {
  constructor() {
    this.container = document.getElementById("videoPlayerContainer");
    if (!this.container) {
      log.warn("No #videoPlayerContainer found!");
      return;
    }
    this.container.innerHTML = "<h3>Video Player</h3>";
  }

  renderFrame(frameData) {
    // For demonstration, just show the raw SVG string
    // If you want to actually show an SVG, you could parse it, or show images
    this.container.innerHTML = `
      <h3>Video Player</h3>
      <div>${frameData}</div>
    `;
  }
}

export default VideoPlayerView;