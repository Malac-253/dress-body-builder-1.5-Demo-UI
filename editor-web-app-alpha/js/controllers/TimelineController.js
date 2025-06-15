// TimelineController.js
import Logger from "../logger.js";
import TimelineModel from "../models/TimelineModel.js";
import TimelineView from "../views/TimelineView.js";
import SoundController from "./SoundController.js"; // OPTIONAL

const log = Logger.createLogger("TimelineController");

class TimelineController {
  constructor() {
    log.setFunctionPrefix("constructor");
    log.trace("Initializing Timeline Controller");
    log.clearFunctionPrefix();

    this.model = new TimelineModel();
    this.view = new TimelineView();
    // Business logic lives here:
    this.soundController = new SoundController(); // OPTIONAL

    // Initialize timeline view with model data.
    this.initializeTimeline();

    // Bind view's "add button" callback.
    this.view.setAddButtonCallback(this.handleAddAnimation.bind(this));

    // Register drag–end callbacks from the view.
    // The drag bars / circle bars in TimelineView call onBlockDragEnd => we handle it:
    this.view.onBlockDragEnd = this.handleBlockUpdate.bind(this);
  
    // For partial re-generation or “dirty” approach:
    this.isDirty = false;
  }

  initializeTimeline() {
    log.setFunctionPrefix("initializeTimeline");
    log.info("Initializing empty timeline");
    this.view.renderTimeline(this.model.getTimeline());
    log.clearFunctionPrefix();
  }

  /**
   * Checks if a block with the given ID exists in the timeline.
   */
  isBlockInTimeline(blockId) {
    const timeline = this.model.getTimeline();
    for (let t = 0; t < timeline.tracks.length; t++) {
      for (let b = 0; b < timeline.tracks[t].length; b++) {
        if (timeline.tracks[t][b].data.id === blockId) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Converts an animation object into a timeline block.
   * This logic is kept solely in the controller.
   */
  convertToTimelineBlock(animation) {
    let start = 0;
    let dur = 5000;
    if (animation.parameters) {
      start = parseFloat(animation.parameters.startTime) || 0;
      dur = parseFloat(animation.parameters.duration) ||
            parseFloat(animation.parameters.dur) || 5000;
    }
    const time = { start, dur, end: start + dur };

    let blockId = (animation.data && animation.data.id)
      ? animation.data.id
      : `timeline-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const timelineBlock = {
      color: animation.color,
      block_name: animation.block_name || animation.name,
      name: animation.name,
      note: animation.note || "",
      type: animation.type || "Static",
      time: time,
      data: {
        id: blockId,
        parameters: animation.parameters || {}
      }
    };

    log.info("Converted animation to timeline block:", timelineBlock);
    return timelineBlock;
  }

  /**
   * Finds a track for a new block (ensuring no overlap) or creates a new track.
   */
  findAvailableTrack(newBlock) {
    const timeline = this.model.getTimeline();
    for (let trackIndex = 0; trackIndex < timeline.tracks.length; trackIndex++) {
      const track = timeline.tracks[trackIndex];
      const overlapFound = track.some(existingBlock =>
        this.blocksOverlap(existingBlock, newBlock)
      );
      if (!overlapFound) {
        return trackIndex;
      }
    }
    const newTrackIndex = timeline.tracks.length;
    timeline.tracks.push([]);
    log.info(`No free track found; created new track at index ${newTrackIndex}`);
    return newTrackIndex;
  }

  /**
   * Returns true if two blocks overlap in time.
   */
  blocksOverlap(block1, block2) {
    return !(block1.time.end <= block2.time.start || block1.time.start >= block2.time.end);
  }

  /**
   * Adds a new animation block to the timeline.
   */
  handleAddAnimation(animation) {
    log.setFunctionPrefix("handleAddAnimation");
    log.info("Handling addition of animation to timeline", animation);

    const timelineBlock = this.convertToTimelineBlock(animation);
    const timeline = this.model.getTimeline();

    let found = false;
    timeline.tracks.forEach(track => {
      track.forEach((block, idx) => {
        if (block.data.id === timelineBlock.data.id) {
          track[idx] = timelineBlock;
          found = true;
        }
      });
    });

    if (!found) {
      const trackIndex = this.findAvailableTrack(timelineBlock);
      log.info(`Inserting block into track ${trackIndex}`);
      timeline.tracks[trackIndex].push(timelineBlock);
    }

    this.view.renderTimeline(timeline);

    // Optionally auto-save:
    // this.autoSaveTimeline();

    // Mark timeline as dirty => re-generate frames
    this.isDirty = true;

    log.clearFunctionPrefix();
  }

  removeBlockFromTrack(trackIndex, block) {
    const timeline = this.model.getTimeline();
    if (timeline.tracks[trackIndex]) {
      const idx = timeline.tracks[trackIndex].findIndex(b => b === block);
      if (idx !== -1) {
        timeline.tracks[trackIndex].splice(idx, 1);
      }
    }
  }

  /**
   * Moves a block from one track to another.
   */
  handleBlockMove(block, fromTrack, toTrack) {
    this.model.removeBlockById(block.data.id);
    const timeline = this.model.getTimeline();
    if (!timeline.tracks[toTrack]) {
      timeline.tracks[toTrack] = [];
    }
    timeline.tracks[toTrack].push(block);

    // Update parameters to reflect new track timing if needed.
    block.data.parameters.startTime = block.time.start;
    block.data.parameters.duration = block.time.dur;

    this.view.renderTimeline(timeline);
    // Optionally auto-save:
    // this.autoSaveTimeline();

    log.info("Block moved => track " + fromTrack + " to track " + toTrack);
    this.isDirty = true;
  }

  /**
   * Called when a block is clicked to edit; forwards the block to the ParametersController.
   */
  handleBlockEdit(block) {
    log.info("Block edit triggered", block);
    if (typeof this.onBlockEdit === "function") {
      this.onBlockEdit(block);
    } else {
      log.warn("onBlockEdit callback is not defined!");
    }
  }

  /**
   * Called when the view reports that a block drag/resizing is finished.
   * newData is expected to include updated timing information.
   */
  handleBlockUpdate(updateObj) {
    log.setFunctionPrefix("handleBlockUpdate");
    const timeline = this.model.getTimeline();
    let oldBlock = null;
    let oldTrackIndex = 0;

    timeline.tracks.forEach((track, tIndex) => {
      track.forEach(block => {
        if (block.data.id === updateObj.id) {
          oldBlock = block;
          oldTrackIndex = tIndex;
        }
      });
    });

    if (!oldBlock) {
      log.warn("Block not found for update:", updateObj.id);
      log.clearFunctionPrefix();
      return;
    }

    // Merge updated info (name, color, parameters, and timing overrides if provided)
    if (updateObj.timeOverride) {
      oldBlock.time.start = updateObj.timeOverride.start;
      oldBlock.time.dur = updateObj.timeOverride.dur;
      oldBlock.time.end = oldBlock.time.start + oldBlock.time.dur;
      // Also update parameters accordingly:
      oldBlock.data.parameters.startTime = oldBlock.time.start;
      oldBlock.data.parameters.duration = oldBlock.time.dur;
    }

    const updatedBlock = {
      ...oldBlock,
      name: updateObj.name,
      color: updateObj.color || oldBlock.color,
      data: {
        ...oldBlock.data,
        parameters: updateObj.parameters
      }
    };

    // remove old block
    this.model.removeBlockById(updateObj.id);

    // re-insert updated
    if (!timeline.tracks[oldTrackIndex]) {
      timeline.tracks[oldTrackIndex] = [];
    }
    timeline.tracks[oldTrackIndex].push(updatedBlock);
    this.view.renderTimeline(timeline);

    log.info("Timeline block updated", updatedBlock);
    // Optionally auto-save:
    // this.autoSaveTimeline();

    // Mark dirty => re-generate frames as needed
    this.isDirty = true;

    log.clearFunctionPrefix();
  }

  

  

  /**
   * Simulates playback by running blocks that are active at a given time.
   * This is called by PlaybackController.
   */
  runBlocksAtTime(currentMs, { skipSound = false, fastForwardFactor = 1.0 } = {}) {
    const timeline = this.model.getTimeline();
    timeline.tracks.forEach(track => {
      track.forEach(block => {
        const start = block.time.start;
        const end = block.time.end;
        if (currentMs >= start && currentMs < end) {
          this.triggerBlock(block, skipSound, fastForwardFactor);
        }
      });
    });
  }

  /**
   * Placeholder for triggering a block's animation and sound.
   */
  // TODO :trigger on preview svg 
  triggerBlock(block, skipSound, fastForwardFactor) {
    const remainingMs = block.time.end - block.time.start;
    const compressedMs = remainingMs / fastForwardFactor;
    const shouldSleep = skipSound;

    // If a sound is specified and you want to trigger it:
    // if (block.data.parameters.soundFile && this.soundController) {
    //   this.soundController.playSound(
    //     block.data.parameters.soundFile,
    //     block.time.start,
    //     compressedMs,
    //     { skip: shouldSleep }
    //   );
    // }

    log.info(
      `Triggering block ${block.data.id} [${block.name}] at time scale x${fastForwardFactor} (skipSound=${skipSound}), compressed remaining time: ${compressedMs} ms.`
    );

    // Placeholder for animation function call:
    // if (window.animations && typeof window.animations[block.name] === "function") {
    //   window.animations[block.name](block.data.parameters, { skipSound, compressedMs });
    // }
  }

  /**
   * OPTIONAL: autoSaveTimeline - saves the timeline data (e.g., to localStorage)
   */
  autoSaveTimeline() {
    try {
      const timelineData = this.model.getTimeline();
      const jsonStr = JSON.stringify(timelineData);
      localStorage.setItem("myTimelineAutoSave", jsonStr);
      log.info("Auto-saved timeline to localStorage.");
    } catch (err) {
      log.warn("AutoSave failed:", err);
    }
  }

  /**
   * OPTIONAL: autoLoadTimeline - loads timeline data (e.g., from localStorage)
   */
  autoLoadTimeline() {
    try {
      const saved = localStorage.getItem("myTimelineAutoSave");
      if (saved) {
        const parsed = JSON.parse(saved);
        this.model.setTimeline(parsed);
        this.view.renderTimeline(this.model.getTimeline());
        log.info("Auto-loaded timeline from localStorage.");
      }
    } catch (err) {
      log.warn("AutoLoad failed:", err);
    }
  }
}

export default TimelineController;
