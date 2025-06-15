// views/TimelineView.js
import Logger from "../logger.js";

const log = Logger.createLogger("TimelineView");

// Set minimum block width to 200px.
const MIN_WIDTH_PX = 25;

class TimelineView {
  constructor() {
    log.setFunctionPrefix("constructor");
    log.trace("Initializing Timeline View");
    log.clearFunctionPrefix();

    // Grab required DOM elements.
    this.timelineContainer = document.getElementById("timelineContainer");
    this.timelineNumbers = document.getElementById("timelineNumbers");
    this.timelineTracks = document.getElementById("timelineTracks");
    this.timelineDebug = document.getElementById("timelineDebug");
    this.frameLoading = document.getElementById("frameLoading");

    if (
      !this.timelineContainer ||
      !this.timelineNumbers ||
      !this.timelineTracks ||
      !this.timelineDebug
    ) {
      log.error("Timeline UI elements not found!");
      return;
    }

    // Callback for when block dragging ends.
    this.onBlockDragEnd = null;
  }

  /**
   * Registers a callback for the timeline add button.
   */
  setAddButtonCallback(callback) {
    log.setFunctionPrefix("setAddButtonCallback");
    log.info("Setting timeline add callback");
    this.addButtonCallback = callback;
    log.clearFunctionPrefix();
  }

  /**
   * Renders the timeline.
   */
  renderTimeline(timelineData) {
    log.setFunctionPrefix("renderTimeline");
    log.trace("Rendering timeline", timelineData);

    // Save timeline data.
    this.timelineData = timelineData;

    // Clear existing elements.
    this.timelineNumbers.innerHTML = "";
    this.timelineTracks.innerHTML = "";
    this.timelineDebug.innerHTML = "";

    const totalTimeMs = 120000;
    const cellMs = 1000;
    const pxPerMs = 0.1;
    const containerWidth = totalTimeMs * pxPerMs;

    this.timelineNumbers.style.width = containerWidth + "px";
    this.timelineTracks.style.width = containerWidth + "px";

    // Create time markers.
    for (let i = 0; i <= totalTimeMs / cellMs; i++) {
      const leftPos = i * cellMs * pxPerMs;
      const minutes = Math.floor(i / 60);
      const seconds = i % 60;
      const labelStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

      const label = document.createElement("div");
      label.classList.add("timeline-time-label");
      label.style.left = leftPos + "px";
      label.textContent = labelStr;
      this.timelineNumbers.appendChild(label);

      const verticalLine = document.createElement("div");
      verticalLine.classList.add("timeline-grid-line");
      verticalLine.style.left = leftPos + "px";
      this.timelineTracks.appendChild(verticalLine);
    }

    // Helper: Calculate heights for overlapping blocks.
    function calculateHeights(events) {
      const sortedEvents = events.sort((a, b) => a.time.start - b.time.start);
      let activeEvents = [];
      const heightLevels = [];
      sortedEvents.forEach((event) => {
        activeEvents = activeEvents.filter((e) => e.time.end > event.time.start);
        activeEvents.push(event);
        const level = activeEvents.length;
        const heightPercent = Math.max(40, 100 - (level - 1) * 20);
        heightLevels.push({ event, heightPercent });
      });
      return heightLevels.map(({ event, heightPercent }) => ({
        ...event,
        heightPercent
      }));
    }

    const tracks = timelineData.tracks || [];
    if (tracks.length === 0) {
      log.warn("No tracks found in timeline data!");
    }

    const pxPerSecond = 100;
    const minDuration = 1000;
    const totalTracks = tracks.length;
    const self = this;

    tracks.forEach((trackEvents, trackIndex) => {
      const trackRow = document.createElement("div");
      trackRow.classList.add("track-row");
      trackRow.dataset.trackIndex = trackIndex;

      const adjustedEvents = calculateHeights(trackEvents);
      adjustedEvents.forEach((event, eventIndex) => {
        const block = event;
        const eventBlock = document.createElement("div");
        eventBlock.classList.add("timeline-animation");

        const leftPx = (block.time.start / 1000) * pxPerSecond;
        let computedWidth = (block.time.dur / 1000) * pxPerSecond;
        if (computedWidth < MIN_WIDTH_PX) {
          computedWidth = MIN_WIDTH_PX;
        }
        eventBlock.style.left = `${leftPx}px`;
        eventBlock.style.width = `${computedWidth}px`;

        eventBlock.style.height = `${block.heightPercent}%`;
        eventBlock.style.bottom = "0px";
        eventBlock.style.backgroundColor = block.color;
        eventBlock.dataset.trackIndex = trackIndex;
        eventBlock.dataset.eventIndex = eventIndex;
        block.trackIndex = trackIndex;

        eventBlock.addEventListener("click", (e) => {
          if (eventBlock.__isDragging) return;
          log.info("Timeline block clicked", block);
          if (typeof self.onBlockSelect === "function") {
            self.onBlockSelect(block);
          }
        });

        // LEFT HANDLE for resizing (adjust start & duration)
        const leftHandle = document.createElement("div");
        leftHandle.classList.add("timeline-handle", "timeline-handle-left");
        leftHandle.addEventListener("mousedown", (e) => {
          e.stopPropagation();
          let startX = e.clientX;
          const origStart = block.time.start;
          const origDur = block.time.dur;
          const onMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - startX;
            startX = moveEvent.clientX;
            const deltaMs = (deltaX / pxPerSecond) * 1000;
            let newStart = block.time.start + deltaMs;
            let newDur = block.time.dur - deltaMs;
            if (newStart < 0) {
              newStart = 0;
              newDur = origStart + origDur;
            }
            if (newDur < minDuration) {
              newDur = minDuration;
              newStart = block.time.start + (block.time.dur - minDuration);
            }
            eventBlock.style.left = `${(newStart / 1000) * pxPerSecond}px`;
            let widthPx = (newDur / 1000) * pxPerSecond;
            if (widthPx < MIN_WIDTH_PX) { widthPx = MIN_WIDTH_PX; }
            eventBlock.style.width = `${widthPx}px`;
            eventBlock.newData = { start: newStart, dur: newDur };
          };
          const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            if (typeof self.onBlockDragEnd === "function" && eventBlock.newData) {
              self.onBlockDragEnd({
                id:block.data.id,
                parameters: {
                  ...block.data.parameters,
                  startTime:eventBlock.newData.start,
                  duration:eventBlock.newData.dur
                },
                timeOverride: {
                  start:eventBlock.newData.start,
                  dur:eventBlock.newData.dur
                }
              });
            }
          };
          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
        });

        // RIGHT HANDLE for resizing (adjust duration)
        const rightHandle = document.createElement("div");
        rightHandle.classList.add("timeline-handle", "timeline-handle-right");
        rightHandle.addEventListener("mousedown", (e) => {
          e.stopPropagation();
          let startX = e.clientX;
          const onMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - startX;
            startX = moveEvent.clientX;
            const deltaMs = (deltaX / pxPerSecond) * 1000;
            let newDur = block.time.dur + deltaMs;
            newDur = Math.max(minDuration, newDur);
            let widthPx = (newDur / 1000) * pxPerSecond;
            if (widthPx < MIN_WIDTH_PX) { widthPx = MIN_WIDTH_PX; }
            eventBlock.style.width = `${widthPx}px`;
            eventBlock.newData = { start: block.time.start, dur: newDur };
          };
          const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            if (typeof self.onBlockDragEnd === "function" && eventBlock.newData) {
              self.onBlockDragEnd({
                id: block.data.id,
                parameters: {
                  ...block.data.parameters,
                  startTime: block.time.start,
                  duration: eventBlock.newData.dur
                }
              });
            }
          };
          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
        });

        // Append resize handles and label.
        eventBlock.appendChild(leftHandle);
        const labelSpan = document.createElement("span");
        labelSpan.classList.add("timeline-label");
        labelSpan.textContent = block.name;
        labelSpan.style.position = "absolute";
        labelSpan.style.left = "5px";
        labelSpan.style.top = "0px";
        eventBlock.appendChild(labelSpan);
        eventBlock.appendChild(rightHandle);

        // NEW: Add left move peg (drag circle) for repositioning.
        const leftPeg = document.createElement("div");
        leftPeg.classList.add("horizontal-move-peg", "horizontal-move-peg-left");
        leftPeg.style.cssText = `
          position: absolute;
          left: 15px; top: 50%; transform: translateY(-50%);
          width: 10px; height: 10px; border-radius: 50%;
          background-color: #444; cursor: ew-resize;
        `;
        leftPeg.addEventListener("mousedown", (e) => {
          e.stopPropagation();
          e.preventDefault();
          let startX = e.clientX;
          const onMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - startX;
            startX = moveEvent.clientX;
            const deltaMs = (deltaX / pxPerSecond) * 1000;
            let newStart = block.time.start + deltaMs;
            if (newStart < 0) newStart = 0;
            block.time.start = newStart;
            block.time.end = newStart + block.time.dur;
            eventBlock.style.left = `${(block.time.start / 1000) * pxPerSecond}px`;
          };
          const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            if (typeof self.onBlockDragEnd === "function") {
              self.onBlockDragEnd({
                id: block.data.id,
                parameters: {
                  ...block.data.parameters,
                  startTime: block.time.start,
                  duration: block.time.dur
                }
              });
            }
          };
          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
        });
        eventBlock.appendChild(leftPeg);

        // NEW: Add right move peg (drag circle) for repositioning.
        const rightPeg = document.createElement("div");
        rightPeg.classList.add("horizontal-move-peg", "horizontal-move-peg-right");
        rightPeg.style.cssText = `
          position: absolute;
          right: 15px; top: 50%; transform: translateY(-50%);
          width: 10px; height: 10px; border-radius:50%;
          background-color: #444; cursor: ew-resize;
        `;
        rightPeg.addEventListener("mousedown", (e) => {
          e.stopPropagation();
          e.preventDefault();
          let startX = e.clientX;
          const onMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - startX;
            startX = moveEvent.clientX;
            const deltaMs = (deltaX / pxPerSecond) * 1000;
            let newStart = block.time.start + deltaMs;
            if (newStart < 0) newStart = 0;
            block.time.start = newStart;
            block.time.end = newStart + block.time.dur;
            eventBlock.style.left = `${(block.time.start / 1000) * pxPerSecond}px`;
          };
          const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            if (typeof self.onBlockDragEnd === "function") {
              self.onBlockDragEnd({
                id: block.data.id,
                parameters: {
                  ...block.data.parameters,
                  startTime: block.time.start,
                  duration: block.time.dur
                }
              });
            }
          };
          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
        });
        eventBlock.appendChild(rightPeg);

        // Add vertical drag handles (top & bottom)
        const topHandle = document.createElement("div");
        topHandle.classList.add("vertical-drag-handle", "vertical-drag-handle-top");
        topHandle.style.cssText = `
          position:absolute; top:2px; left:50%; transform:translateX(-50%);
          width:10px; height:10px; border-radius:50%; background-color:#888; cursor: ns-resize;
        `;
        eventBlock.appendChild(topHandle);

        const bottomHandle = document.createElement("div");
        bottomHandle.classList.add("vertical-drag-handle", "vertical-drag-handle-bottom");
        bottomHandle.style.cssText = `
          position:absolute; bottom:2px; left:50%; transform:translateX(-50%);
          width:10px; height:10px; border-radius:50%; background-color:#888; cursor: ns-resize;
        `;
        eventBlock.appendChild(bottomHandle);

        // Vertical drag handle event listeners.
        topHandle.addEventListener("mousedown", (e) => {
          e.stopPropagation();
          e.preventDefault();
          const origTrack = Number(eventBlock.dataset.trackIndex);
          let startY = e.clientY;
          const onMouseMove = (moveEvent) => {
            const deltaY = moveEvent.clientY - startY;
            if (deltaY < -25 && origTrack > 0) {
              if (typeof self.onBlockMove === "function") {
                self.onBlockMove(block, origTrack, origTrack - 1);
              }
              document.removeEventListener("mousemove", onMouseMove);
              document.removeEventListener("mouseup", onMouseUp);
            }
          };
          const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
          };
          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
        });

        bottomHandle.addEventListener("mousedown", (e) => {
          e.stopPropagation();
          e.preventDefault();
          const origTrack = Number(eventBlock.dataset.trackIndex);
          let startY = e.clientY;
          const onMouseMove = (moveEvent) => {
            const deltaY = moveEvent.clientY - startY;
            if (deltaY > 25 && origTrack < totalTracks - 1) {
              if (typeof self.onBlockMove === "function") {
                self.onBlockMove(block, origTrack, origTrack + 1);
              }
              document.removeEventListener("mousemove", onMouseMove);
              document.removeEventListener("mouseup", onMouseUp);
            }
          };
          const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
          };
          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
        });

        trackRow.appendChild(eventBlock);
      });
      this.timelineTracks.appendChild(trackRow);
    });

    // Add a scrubber for timeline navigation.
    const scrubber = document.createElement("div");
    scrubber.classList.add("scrubber");
    scrubber.id = "scrubber";
    this.timelineTracks.appendChild(scrubber);

    // Enable scrubber dragging.
    scrubber.addEventListener("mousedown", (e) => {
      let shiftX = e.clientX - scrubber.getBoundingClientRect().left;
      document.addEventListener("mousemove", moveScrubber);
      document.addEventListener("mouseup", () => {
        document.removeEventListener("mousemove", moveScrubber);
      });

      function moveScrubber(event) {
        let newLeft =
          event.clientX - shiftX - scrubber.parentElement.getBoundingClientRect().left;
        newLeft = Math.max(0, Math.min(newLeft, containerWidth));
        scrubber.style.left = newLeft + "px";
        log.info(`[MOCK] Scrubber moved to ${newLeft}px`);
      }
    });

    // Debug info – display timeline data structure.
    this.timelineDebug.textContent = JSON.stringify(timelineData, null, 2);
    log.info("Timeline rendered");
    log.clearFunctionPrefix();
  }

  /**
   * (Optional) Adds debug controls for copying/importing timeline data.
   */
  addDebugControls() {
    const copyBtn = document.createElement("button");
    copyBtn.textContent = "Copy Timeline";
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(JSON.stringify(this.timelineData, null, 2))
        .then(() => alert("Timeline copied to clipboard!"))
        .catch(err => console.error("Clipboard error:", err));
    });
    document.body.appendChild(copyBtn);

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json";
    fileInput.addEventListener("change", async (evt) => {
      const file = evt.target.files[0];
      if (!file) return;
      const text = await file.text();
      // You could then pass the parsed timeline data to a callback.
    });
    document.body.appendChild(fileInput);
  }
}

export default TimelineView;
