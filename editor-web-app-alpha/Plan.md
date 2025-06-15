# Finalized Plan and File Breakdown for Alpha Version

## Overview

We are now at a stage where we have a clear modular structure for the timeline, video controls, animations, layer system, and sound integration. Below is the full breakdown of how the system should be organized, with an MVC structure and clear separation of concerns.

---

## 📌 Key Features

- **Modularized Timeline System**: Implementing grid-based snapping using track rows & track cells instead of a single long div.
- **SVG Layering & Tree System**: A collapsible tree UI reflecting the SVG structure for future non-SVG rendering.
- **Search and Filtering**: A search bar to find elements by ID or type (for both layers and animations).
- **MP4 Rendering & Sound Addition**: Drag-and-drop support for adding sounds and animations into the timeline.
- **Drag-and-Drop System**: Proper track stacking with handling for maximum layers per track (tentatively 4-5 max).
- **Canvas Playback System**: Generating frames ahead of time rather than during playback for optimized performance.

---

## 📂 Project File Structure

Below is the proposed file structure for all the necessary files.

```
/AlphaProject
│── /config
│   │── config.js  (Stores global settings, test flags, enums)
│── /js
│   │── main.js  (Initializes everything, loads configs)
│   │── logger.js  (Custom logging system)
│   │── svgManager.js  (Manages SVG animations safely)
│   │── /controllers
│   │   │── TimelineController.js
│   │   │── VideoPlayerController.js
│   │   │── AnimationController.js
│   │   │── LayerTreeController.js
│   │   │── SoundController.js
│   │── /models
│   │   │── TimelineModel.js
│   │   │── VideoPlayerModel.js
│   │   │── AnimationModel.js
│   │   │── LayerTreeModel.js
│   │   │── SoundModel.js
│   │── /views
│   │   │── TimelineView.js
│   │   │── VideoPlayerView.js
│   │   │── AnimationView.js
│   │   │── LayerTreeView.js
│   │   │── SoundView.js
│── /examples
│   │── /view
│   │   │── mockPopulateTimeline.js
│   │   │── mockPopulateParameters.js
│   │   │── mockPopulateLayers.js
│   │   │── mockPopulateAnimationList.js
│   │── /model
│   │   │── mockTimelineModel.js
│   │   │── mockAnimationModel.js
│   │   │── mockSoundModel.js
│   │── /controller
│   │   │── mockTimelineController.js
│   │   │── mockAnimationController.js
│── /css
│   │── alphaStyles.css  (Main styles)
│   │── timelineStyles.css  (Timeline-specific styles)
│   │── uiStyles.css  (UI enhancements)
│── index.html  (Main UI)
```

---

## 📝 Function Breakdown

Below is a breakdown of the functions in each file.

### 1️⃣ Timeline Management (Snapping, Dragging, and Data Handling)

#### 🟢 `TimelineController.js`
Handles logic for the timeline, such as adding, updating, and managing events.

- `initializeTimeline()`
- `addToTimeline(eventData)`
- `removeFromTimeline(eventId)`
- `updateTimeline()`
- `moveTimelineEvent(eventId, newTime)`
- `resizeTimelineEvent(eventId, newDuration)`
- `getTimelineData()`

#### 🟠 `TimelineModel.js`
Stores all timeline-related data.

- `timelineData`
- `setTimelineData(newData)`
- `getTimelineData()`

#### 🔵 `TimelineView.js`
Manages rendering of the timeline UI.

- `renderTimeline()`
- `renderTrack(trackId)`
- `renderTimelineEvent(eventData)`
- `setupDragDrop()`
- `updateScrubber(position)`

---

### 2️⃣ Video Controls (Playback, Scrubber, Frame Preloading)

#### 🟢 `VideoPlayerController.js`
Manages playback controls.

- `play()`
- `pause()`
- `scrubTo(time)`
- `loadFrames(eventId)`
- `generatePreviewFrames(eventId)`
- `renderFrame(frameIndex)`

#### 🟠 `VideoPlayerModel.js`
Stores frame data and playback state.

- `currentTime`
- `frames`
- `loadFrameData(eventId, frameList)`

#### 🔵 `VideoPlayerView.js`
Manages UI elements.

- `renderPlayButton()`
- `renderScrubber()`
- `updateCanvas(frameData)`

---

### 3️⃣ Animation & SVG Handling

#### 🟢 `AnimationController.js`
Handles logic for inserting, modifying, and removing animations.

- `loadAnimationList()`
- `applyAnimation(animationId, params)`
- `generateAnimationFrames(animationId)`
- `removeAnimation(animationId)`

#### 🟠 `AnimationModel.js`
Stores all animation-related data.

- `animations`
- `getAnimation(animationId)`

#### 🔵 `AnimationView.js`
Manages UI for animation selection.

- `renderAnimationList()`
- `showAnimationParams(animationId)`

---

### 4️⃣ Layer Tree System (Reflecting SVG Layers)

#### 🟢 `LayerTreeController.js`
Handles collapsible layers.

- `generateLayerTree(svgData)`
- `toggleLayerVisibility(layerId, visible)`
- `searchLayers(searchQuery)`

#### 🟠 `LayerTreeModel.js`
Stores the current layer data.

- `layers`
- `getLayer(layerId)`

#### 🔵 `LayerTreeView.js`
Manages UI for the layer tree.

- `renderLayerTree()`
- `expandCollapseLayer(layerId)`

---

### 5️⃣ Sound System (MP4 Exporting, Audio Syncing)

#### 🟢 `SoundController.js`
Handles sound integration.

- `loadSoundList()`
- `applySound(soundId, params)`
- `syncSoundWithAnimation(animationId, soundId)`

#### 🟠 `SoundModel.js`
Stores sound-related data.

- `sounds`
- `getSound(soundId)`

#### 🔵 `SoundView.js`
Manages UI for selecting and applying sounds.

- `renderSoundList()`
- `showSoundParams(soundId)`

---

## ✅ Next Steps

1. **Implement UI Improvements**
   - Modern UI design (rounded corners, pastel colors).
   - Search bar for animations and layers.
   - Improved drag-and-drop timeline.

2. **Finalize Timeline Snapping**
   - Implement grid-based snapping.

3. **Prepare Frame Optimization**
   - Store pre-rendered frames in the model.
   - Only regenerate frames when necessary.

---

## 📌 Notes

- The project follows an **MVC structure** for modularity.
- Code will be heavily commented for **ease of understanding**.
- Performance optimizations will be **incrementally improved** as we refine the system.

---

This **Alpha Version** is built with **future scalability** in mind, allowing for **MP4 exporting, enhanced UI, and efficient frame rendering**.

---

Let me know if this structure **fully matches your expectations**, and I’ll continue generating the **individual scripts** accordingly!


ALL HAVE 

      {
        "color": "#8aaac8",
        "block_name":"Add SVG car"
        "name": "Add SVG",
        "note": "Red Car added",
        "type": "Static",
        "time": {
          "start": 1,
          "dur": 4,
          "end": 5
        },
        "data":{
               "id": "add-svg",
               "parameters": {
                  "startTime": "1000",
                  "duration": "1000",
                  "delay": "1",
                  "file": "add path here ...",
                  "scalX": "1",
                  "scalY": "1",
                  "tranX": "0",
                  "tranY": "0",
                  "rotat": "0",
                  "dur": "1000",
                  "ease": "d3.easeCubic"
               }
            }
      }