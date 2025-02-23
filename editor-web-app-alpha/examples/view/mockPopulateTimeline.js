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
    // Timeline Data Structure
    const timelineData = {
        tracks: [
            [
                { color: "#8aaac8", name: "Walking", note: "Character walking cycle", type: "Animation", char: "Character1", time: { start: 1, dur: 4, end: 5 } },
                { color: "#05f487", name: "Waving", note: "Character Waving", type: "Animation", char: "Character1", time: { start: 2, dur: 2, end: 4 } },
                { color: "#7a3b41", name: "Walking", note: "Character walk 4", type: "Animation", char: "Character2", time: { start: 7, dur: 7, end: 14 } },
                { color: "#0e1ef0", name: "Walking", note: "Character walk 7", type: "Animation", char: "Character2", time: { start: 8, dur: 7, end: 15 } },
                { color: "#c2520f", name: "Walking", note: "Character walk 6", type: "Animation", char: "Character2", time: { start: 9, dur: 7, end: 17 } },
                { color: "#4a6d12", name: "Walking", note: "Character walk 5", type: "Animation", char: "Character2", time: { start: 10, dur: 4, end: 14 } }
            ],
            [
                { color: "#c90076", name: "Add Text", note: "Text: Hello World", type: "Text", text: "Hello World", time: { start: 0, dur: 1, end: 1 } },
                { color: "#3e473b", name: "Add Text", note: "Text: Hello World 2", type: "Text", text: "Hello World 2", time: { start: 2, dur: 2, end: 4 } },
                { color: "#19f0e4", name: "Add Text", note: "Text: Hello World 3", type: "Text", text: "Hello World 3", time: { start: 5, dur: 3, end: 8 } }
            ],
            [
                { color: "#51981a", name: "Jumping", note: "Character Jumping", type: "Animation", char: "Character1", time: { start: 2, dur: 8, end: 10 } },
                { color: "#fcfead", name: "Add Text", note: "Text: Hello World 4", type: "Text", text: "Hello World 4", time: { start: 8, dur: 3, end: 11 } }
            ],
            [
                { color: "#51981a", name: "Jumping", note: "Character Jumping", type: "Animation", char: "Character1", time: { start: 2, dur: 8, end: 10 } },
                { color: "#fcfead", name: "Add Text", note: "Text: Hello World 4", type: "Text", text: "Hello World 4", time: { start: 0.5, dur: 110, end: 110.5 } }
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
        const leftPos = i * cellMs * pxPerMs;

        const minutes = Math.floor(i / 60);
        const seconds = i % 60;
        const labelStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

        // Time label
        const label = document.createElement("div");
        label.classList.add("timeline-time-label");
        label.style.left = leftPos + "px";
        label.textContent = labelStr;
        timelineNumbers.appendChild(label);

        // Vertical grid line
        const verticalLine = document.createElement("div");
        verticalLine.classList.add("timeline-grid-line");
        verticalLine.style.left = leftPos + "px";
        timelineTracks.appendChild(verticalLine);
    }

    // Function to adjust heights so all items bottom-align
    function calculateHeights(events) {
        const sortedEvents = events.sort((a, b) => a.time.start - b.time.start);
        let activeEvents = [];
        const heightLevels = [];

        sortedEvents.forEach(event => {
            activeEvents = activeEvents.filter(e => e.time.end > event.time.start);
            activeEvents.push(event);

            const level = activeEvents.length;
            const heightPercent = Math.max(40, 100 - (level - 1) * 20);

            heightLevels.push({ event, heightPercent, bottomAlign: 100 });
        });

        return heightLevels.map(({ event, heightPercent, bottomAlign }) => ({
            ...event,
            heightPercent,
            bottomAlign
        }));
    }

    // Populate Tracks Dynamically
    timelineData.tracks.forEach((trackEvents, trackIndex) => {
        const trackRow = document.createElement("div");
        trackRow.classList.add("track-row");
        trackRow.dataset.trackIndex = trackIndex;

        const adjustedEvents = calculateHeights(trackEvents);

        adjustedEvents.forEach(event => {
            const eventBlock = document.createElement("div");
            eventBlock.classList.add("timeline-animation");

            eventBlock.style.left = `${event.time.start * 100}px`;
            eventBlock.style.width = `${event.time.dur * 100}px`;
            eventBlock.style.height = `${event.heightPercent}%`;
            eventBlock.style.backgroundColor = event.color;
            eventBlock.style.bottom = "0px"; // Align to bottom of the track

            // Left Handle
            const leftHandle = document.createElement("div");
            leftHandle.classList.add("timeline-handle", "timeline-handle-left");

            // Right Handle
            const rightHandle = document.createElement("div");
            rightHandle.classList.add("timeline-handle", "timeline-handle-right");

            // Add event name
            const label = document.createElement("span");
            label.classList.add("timeline-label");
            label.textContent = event.name;
            label.style.position = "absolute";
            label.style.left = "5px"; // Always visible at the start
            label.style.top = "0px"; // Move to top to avoid being hidden

            // Tooltip using title attribute
            eventBlock.setAttribute("title", `${event.name}: ${event.note}`);

            eventBlock.appendChild(leftHandle);
            eventBlock.appendChild(label);
            eventBlock.appendChild(rightHandle);

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
            newLeft = Math.max(0, Math.min(newLeft, containerWidth));
            scrubber.style.left = newLeft + "px";
            Logger.info(`[MOCK] Scrubber moved to ${newLeft}px`);
        }
    });

    // Debug Information
    timelineDebug.textContent = JSON.stringify(timelineData, null, 2);

    // Frame Loading Display
    // frameLoading.style.display = "inline-block";
    // setTimeout(() => {
    //     frameLoading.style.display = "none";
    // }, 5000);

    Logger.info("[MOCK] Timeline dynamically populated");
}
