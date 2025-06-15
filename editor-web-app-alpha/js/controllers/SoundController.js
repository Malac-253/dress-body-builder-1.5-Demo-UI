// SoundController.js
import Logger from "../logger.js";
const log = Logger.createLogger("SoundController");

export default class SoundController {
  constructor() {
    this.activeSounds = new Map(); // track sounds by block ID if needed
  }

  /**
   * Play or skip a sound. If skip is true, we don't actually play it.
   * If loop is true, the sound loops until manually stopped or until block ends.
   */
  playSound(soundFile, startTime, duration, { skip = false } = {}) {
    if (skip) {
      console.info(`Skipping sound for ${soundFile} due to fast-forward.`);
      return;
    }
    // Placeholder: either HTMLAudioElement or Web Audio API
    console.info(`Playing sound ${soundFile} for ${duration} ms, starting at ${startTime}.`);

    log.info(`Playing sound for block ${blockId}: ${soundFile} (loop=${loop})`);

    const audio = new Audio(soundFile);
    audio.loop = loop;
    audio.play().catch(err => log.warn("Audio play error:", err));

    // Optionally cut off if durationMs is shorter than sound length
    if (!loop && durationMs && durationMs < 10000000) { // arbitrary cutoff
      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
      }, durationMs);
    }

    // store it if you want to manage it later
    this.activeSounds.set(blockId, audio);
  }

  stopSound(blockId) {
    const audio = this.activeSounds.get(blockId);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      this.activeSounds.delete(blockId);
    }
  }
}
