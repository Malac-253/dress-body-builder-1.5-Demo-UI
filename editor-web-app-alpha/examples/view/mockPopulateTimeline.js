// mockPopulateTimeline.js - Populates the timeline UI dynamically from a structured timeline data object.
import Logger from "../../js/logger.js";

export function populateMockTimeline() {
    Logger.trace("[MOCK] populateMockTimeline called");

    const timelineContainer = document.getElementById("timelineContainer");
    const timelineNumbers = document.getElementById("timelineNumbers");
    const timelineTracks = document.getElementById("timelineTracks");
    const timelineDebug = document.getElementById("timelineDebug");
    const frameLoading = document.getElementById("frameLoading");

    if (!timelineContainer || !timelineNumbers || !timelineTracks || !timelineDebug) {
        Logger.error("[MOCK] timeline containers not found");
        return;
    }

    // Clear existing content
    timelineNumbers.innerHTML = "";
    timelineTracks.innerHTML = "";
    timelineDebug.innerHTML = "";

    // Timeline Data Structure
    const timelineData = {
        tracks: [
            [
                { name: "Walking", note: "Character walking cycle", type: "Animation", char: "Character1", time: { start: 1, dur: 4, end: 5 } },
                { name: "Waving", note: "Character Waving", type: "Animation", char: "Character1", time: { start: 2, dur: 4, end: 6 } }
            ],
            [
                { name: "Add Text", note: "Text: Hello World", type: "Text", text: "Hello World", time: { start: 0, dur: 1, end: 1 } },
                { name: "Add Text", note: "Text: Hello World 2", type: "Text", text: "Hello World 2", time: { start: 2, dur: 2, end: 4 } },
                { name: "Add Text", note: "Text: Hello World 3", type: "Text", text: "Hello World 3", time: { start: 5, dur: 3, end: 8 } }
            ],
            [
                { name: "Jumping", note: "Character Jumping", type: "Animation", char: "Character1", time: { start: 2, dur: 8, end: 10 } },
                { name: "Add Text", note: "Text: Hello World 4", type: "Text", text: "Hello World 4", time: { start: 8, dur: 3, end: 11 } }
            ]
        ]
    };

    // Define timeline time scaling
    const totalTimeMs = 120_000;
    const cellMs = 1_000;
    const pxPerMs = 0.1;
    const containerWidth = totalTimeMs * pxPerMs;

    timelineNumbers.style.width = containerWidth + "px";
    timelineTracks.style.width = containerWidth + "px";

    // Generate Time Markers & Labels
    for (let i = 0; i <= totalTimeMs / cellMs; i++) {
        const msPosition = i * cellMs;
        const leftPos = msPosition * pxPerMs;

        const minutes = Math.floor(msPosition / 60_000);
        const seconds = Math.floor((msPosition % 60_000) / 1000);
        const labelStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

        // Time label
        const label = document.createElement("div");
        label.classList.add("timeline-time-label");
        label.style.left = leftPos + "px";
        label.textContent = labelStr;
        timelineNumbers.appendChild(label);

        // Vertical lines in timelineTracks
        const verticalLine = document.createElement("div");
        verticalLine.classList.add("timeline-grid-line");
        verticalLine.style.left = leftPos + "px";
        timelineTracks.appendChild(verticalLine);
    }

    // Populate Tracks Dynamically
    timelineData.tracks.forEach((trackEvents, trackIndex) => {
        const trackRow = document.createElement("div");
        trackRow.classList.add("track-row");
        trackRow.dataset.trackIndex = trackIndex;

        trackEvents.forEach((event) => {
            const eventBlock = document.createElement("div");
            eventBlock.classList.add("timeline-animation");

            eventBlock.style.left = `${event.time.start * 100}px`;
            eventBlock.style.width = `${event.time.dur * 100}px`;
            eventBlock.style.backgroundColor = event.type === "Animation" ? "#ffb3ba" : "#bae1ff";

            // Left Handle
            const leftHandle = document.createElement("div");
            leftHandle.classList.add("timeline-handle", "timeline-handle-left");

            // Right Handle
            const rightHandle = document.createElement("div");
            rightHandle.classList.add("timeline-handle", "timeline-handle-right");

            eventBlock.appendChild(leftHandle);
            eventBlock.appendChild(rightHandle);

            eventBlock.textContent = event.name;
            eventBlock.setAttribute("title", `${event.name}: ${event.note}`);

            trackRow.appendChild(eventBlock);
        });

        timelineTracks.appendChild(trackRow);
    });

    // Add scrubber with movement
    const scrubber = document.createElement("div");
    scrubber.classList.add("scrubber");
    scrubber.id = "scrubber";
    timelineTracks.appendChild(scrubber);

    scrubber.addEventListener("mousedown", (e) => {
        let shiftX = e.clientX - scrubber.getBoundingClientRect().left;
        document.addEventListener("mousemove", moveScrubber);
        document.addEventListener("mouseup", () => document.removeEventListener("mousemove", moveScrubber));

        function moveScrubber(event) {
            let newLeft = event.clientX - shiftX - timelineTracks.getBoundingClientRect().left;
            if (newLeft < 0) newLeft = 0;
            if (newLeft > containerWidth) newLeft = containerWidth;
            scrubber.style.left = newLeft + "px";
            Logger.info(`[MOCK] Scrubber moved to ${newLeft}px`);
        }
    });

    // Debug Information
    timelineDebug.textContent = JSON.stringify(timelineData, null, 2);

    // Frame Loading Display
    frameLoading.style.display = "inline-block";
    setTimeout(() => {
        frameLoading.style.display = "none";
    }, 1000);

    Logger.info("[MOCK] Timeline dynamically populated");
}
