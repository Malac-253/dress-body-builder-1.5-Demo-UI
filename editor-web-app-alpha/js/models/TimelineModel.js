import Logger from "../logger.js";

const log = Logger.createLogger("TimelineModel");

class TimelineModel {
  constructor() {
    log.setFunctionPrefix("constructor");
    log.trace("Initializing empty timeline model with tracks data structure");
    // Initialize with one empty track by default.
    this.timelineData = { tracks: [[],[],[],[],[]] };
    log.clearFunctionPrefix();
  }

  /**
   * Returns the entire timeline data structure.
   * @returns {object} Timeline data with tracks.
   */
  getTimeline() {
    log.setFunctionPrefix("getTimeline");
    log.info("Retrieving timeline", this.timelineData);
    log.clearFunctionPrefix();
    return this.timelineData;
  }

  /**
   * Adds an animation block into a given track.
   * @param {object} animation - The timeline block to add.
   * @param {number} trackIndex - The track index to add the block into (defaults to 0).
   */
  addAnimation(animation, trackIndex = 0) {
    log.setFunctionPrefix("addAnimation");
    // Ensure the tracks array has at least trackIndex+1 tracks.
    if (!this.timelineData.tracks[trackIndex]) {
      log.warn(`Track index ${trackIndex} not found. Initializing a new track.`);
      this.timelineData.tracks[trackIndex] = [];
    }
    this.timelineData.tracks[trackIndex].push(animation);
    log.info("Added animation to timeline", { animation, trackIndex });
    log.clearFunctionPrefix();
  }

  /** Resets/clears the timeline */
  resetTimeline() {
    log.setFunctionPrefix("resetTimeline");
    log.warn("Resetting timeline");
    this.timelineData.tracks = this.timelineData.tracks.map(() => []);
    log.clearFunctionPrefix();
  }

  removeBlockById(blockId) {
    // Iterate over each track and remove any block with a matching data.id
    this.timelineData.tracks.forEach((track) => {
      for (let i = track.length - 1; i >= 0; i--) {
        if (track[i].data.id === blockId) {
          track.splice(i, 1);
        }
      }
    });
  }
}

export default TimelineModel;