// VideoPlayerModel.js
import Logger from "../logger.js";
const log = Logger.createLogger("VideoPlayerModel");

class VideoPlayerModel {
  constructor() {
    log.setFunctionPrefix("constructor");
    log.trace("Initializing VideoPlayerModel");
    log.clearFunctionPrefix();

    this.frames = [];
  }

  addFrame(frameData) {
    this.frames.push(frameData);
  }

  reset() {
    this.frames = [];
  }
}

export default VideoPlayerModel;