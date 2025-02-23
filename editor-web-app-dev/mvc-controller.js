/***********************************************
 * mvc-controller.js (UPDATED WITH FPS & TIME DISPLAY)
 ***********************************************/

const Controller = (function(){

  // ---------------------------------------------
  // Configuration & Internal State
  // ---------------------------------------------
  let isPlaying = false;
  let currentFrameIndex = 0;
  let frameTimer = null;
  
  // Use a default total duration in seconds
  let totalDuration = 10;  
  // Scaling factor for timeline horizontal zoom
  let scaleFactor = 1;    
  // Frames per second for playback
  let fps = 25;          

  // DOM element references
  const sel = {
    // Existing references
    animItemsContainer: document.getElementById('animationItems'),
    timelineTracksDiv: document.getElementById('timelineTracks'),
    applyParamsBtn: document.getElementById('applyParamsBtn'),
    loadingInfo: document.getElementById('loadingInfo'),
    btnExportMP4: document.getElementById('btnExportMP4'),
    btnAddSound: document.getElementById('btnAddSound'),
    // We need a spot to display "current time." 
    // For example, define an element <span id="currentTimeDisplay">...</span> near your play button in the HTML.
    currentTimeDisplay: document.getElementById('currentTimeDisplay')
  };

  // Data structure for timeline blocks
  const timelineData = {
    tracks: [ [], [], [] ]
  };

  // ---------------------------------------------
  // Initialization
  // ---------------------------------------------
  function init(){
    // Possibly load animations from server, if needed
    // Model.loadAnimationsFromServer();

    // Render available animations
    const animLib = Model.getAnimationLibrary();
    View.renderAnimationLibrary(animLib);

    // Render the timeline initially
    renderTimeline();

    // Set up various event handlers
    setupDragAndDrop();
    setupTimelineClick();
    setupParamForm();
    setupPlaybackControls();
    setupMiscButtons();
    setupSearchBar();
    setupTimelineSlider();

    // Initialize the scrubber once
    initScrubber();  
  }

  /**********************************************
   * DRAG & DROP
   **********************************************/
  function setupDragAndDrop() {
    const animationItems = document.querySelectorAll('.anim-item');
    const timeline = document.getElementById('timelineTracks');
  
    animationItems.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', item.dataset.animName);
      });
    });
  
    timeline.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
  
    timeline.addEventListener('drop', (e) => {
      e.preventDefault();
      // Only handle drop if the target is exactly timelineTracks 
      if (e.target.id !== 'timelineTracks') return;
      const animationName = e.dataTransfer.getData('text/plain');
      if (animationName) {
        addAnimationToTimeline(animationName, e.clientX, e.clientY);
      } else {
        console.error('No animation name found in data transfer');
      }
    });
  }
  
  function addAnimationToTimeline(animationName, dropX, dropY) {
    const timelineContainer = document.getElementById('timelineContainer');
    const containerRect = timelineContainer.getBoundingClientRect();
    const yOffset = dropY - containerRect.top;
    const trackHeight = 30;

    let trackIndex = Math.floor(yOffset / trackHeight);
    trackIndex = Math.min(Math.max(trackIndex, 0), timelineData.tracks.length - 1);
    
    const startTime = parseFloat((dropX / 100).toFixed(1));
    const duration = 1; // default
    const newBlock = {
      animationName,
      startTime,
      duration,
      textContent: animationName
    };
    Model.addBlockToTrack(trackIndex, newBlock);
    
    renderTimeline();
    showParameterBox(animationName, dropX);
  }

  /**********************************************
   * TIMELINE RENDERING
   **********************************************/
  function renderTimeline() {
    const timeline = document.getElementById('timelineTracks');
    let scrubberElem = document.getElementById('scrubber');
    if (!scrubberElem) {
      scrubberElem = createScrubber();
    }

    // Clear timeline content
    timeline.innerHTML = "";

    // Determine maximum required time
    let maxTime = totalDuration;
    timelineData.tracks.forEach(track => {
      track.forEach(block => {
        const endTime = block.startTime + block.duration;
        if (endTime > maxTime) maxTime = endTime;
      });
    });
    const desiredEndTime = maxTime;

    // Build track rows
    timelineData.tracks.forEach((track, trackIndex) => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'track-row';
      rowDiv.dataset.trackIndex = trackIndex;
      
      track.forEach((item, itemIndex) => {
        const block = document.createElement('div');
        block.className = 'timeline-block';
        block.textContent = `${item.animationName} (${item.textContent})`;
        block.style.left = (item.startTime * 100 * scaleFactor) + 'px';
        block.style.width = (item.duration * 100 * scaleFactor) + 'px';
        block.dataset.trackIndex = trackIndex;
        block.dataset.blockIndex = itemIndex;
        
        // Left & right resizers
        const leftResizer = document.createElement('div');
        leftResizer.className = 'timeline-resizer left';
        leftResizer.addEventListener('mousedown', initLeftResize);
        const rightResizer = document.createElement('div');
        rightResizer.className = 'timeline-resizer right';
        rightResizer.addEventListener('mousedown', initRightResize);
        
        block.appendChild(leftResizer);
        block.appendChild(rightResizer);
        rowDiv.appendChild(block);
      });
      timeline.appendChild(rowDiv);
    });

    // Create time markers
    const markerStep = scaleFactor < 1 ? 5 : 1;
    const markerCount = Math.ceil(desiredEndTime / markerStep) + 1;
    
    const timelineNumbers = document.getElementById('timelineNumbers');
    timelineNumbers.innerHTML = "";
    const overallWidth = desiredEndTime * 50 * scaleFactor;
    timelineNumbers.style.width = overallWidth + 'px';
    timeline.style.width = overallWidth + 'px';
    
    for (let i = 0; i < markerCount; i++) {
      const markerTime = i * markerStep;
      const pos = markerTime * 50 * scaleFactor;
      
      const timeMarker = document.createElement('div');
      timeMarker.className = 'timeline-time-marker';
      timeMarker.style.left = pos + 'px';
      timelineNumbers.appendChild(timeMarker);
      
      const timeLabel = document.createElement('div');
      timeLabel.className = 'timeline-time-label';
      timeLabel.style.left = pos + 'px';
      timeLabel.textContent = markerTime + 's';
      timelineNumbers.appendChild(timeLabel);
      
      const horizontalLine = document.createElement('div');
      horizontalLine.className = 'timeline-horizontal-line';
      horizontalLine.style.left = pos + 'px';
      timeline.appendChild(horizontalLine);
    }

    // Append scrubber on top
    timeline.appendChild(scrubberElem);
    initScrubber(); // re-initialize scrubber events

    // Update debug info
    updateTimelineDebug();
  }

  function updateTimelineDebug() {
    const dbg = document.getElementById('timelineDebug');
    if (dbg) {
      dbg.textContent = JSON.stringify(timelineData, null, 2);
    }
  }

  /**********************************************
   * RESIZING LOGIC
   **********************************************/
  let resizeData = {
    currentBlock: null,
    startX: 0,
    origLeft: 0,
    origWidth: 0,
    side: '' // 'left' or 'right'
  };

  function initLeftResize(e) {
    e.stopPropagation();
    resizeData.currentBlock = e.target.parentElement;
    resizeData.startX = e.clientX;
    resizeData.origLeft = parseFloat(resizeData.currentBlock.style.left);
    resizeData.origWidth = parseFloat(resizeData.currentBlock.style.width);
    resizeData.side = 'left';
    document.addEventListener('mousemove', resizeBlock);
    document.addEventListener('mouseup', stopResize);
  }

  function initRightResize(e) {
    e.stopPropagation();
    resizeData.currentBlock = e.target.parentElement;
    resizeData.startX = e.clientX;
    resizeData.origWidth = parseFloat(resizeData.currentBlock.style.width);
    resizeData.side = 'right';
    document.addEventListener('mousemove', resizeBlock);
    document.addEventListener('mouseup', stopResize);
  }

  function resizeBlock(e) {
    const timelineContainer = document.getElementById('timelineContainer');
    const containerWidth = timelineContainer.scrollWidth;

    const dx = e.clientX - resizeData.startX;
    let newLeft = parseFloat(resizeData.currentBlock.style.left);
    let newWidth = parseFloat(resizeData.currentBlock.style.width);

    if (resizeData.side === 'left') {
      newLeft = resizeData.origLeft + dx;
      if (newLeft < 0) {
        newLeft = 0;
      }
      newWidth = resizeData.origWidth - (newLeft - resizeData.origLeft);

      if (newWidth < 50) {
        newWidth = 50;
        newLeft = resizeData.origLeft + (resizeData.origWidth - 50);
      }

      resizeData.currentBlock.style.left = newLeft + 'px';
      resizeData.currentBlock.style.width = newWidth + 'px';
    } else {
      // Resizing from right
      newWidth = resizeData.origWidth + dx;
      const blockLeft = parseFloat(resizeData.currentBlock.style.left);
      if (blockLeft + newWidth > containerWidth) {
        newWidth = containerWidth - blockLeft;
      }
      if (newWidth < 50) {
        newWidth = 50;
      }
      resizeData.currentBlock.style.width = newWidth + 'px';
    }

    // Update underlying data
    const trackIdx = parseInt(resizeData.currentBlock.dataset.trackIndex, 10);
    const blockIdx = parseInt(resizeData.currentBlock.dataset.blockIndex, 10);

    timelineData.tracks[trackIdx][blockIdx].duration = parseFloat((newWidth / 100).toFixed(1));
    if (resizeData.side === 'left') {
      timelineData.tracks[trackIdx][blockIdx].startTime = parseFloat((newLeft / 100).toFixed(1));
    }

    // Keep scrubber stable
    updateScrubber(getCurrentTime());
  }

  function stopResize() {
    document.removeEventListener('mousemove', resizeBlock);
    document.removeEventListener('mouseup', stopResize);
  }

  /**********************************************
   * PARAMETER BOX
   **********************************************/
  function showParameterBox(animationName, dropX) {
    const parameterBox = document.querySelector('.parameter-editor');
    parameterBox.style.display = 'block';
    parameterBox.style.left = `${dropX}px`;
    
    const startTimeInSeconds = (dropX / 100).toFixed(1);
    const endTime = (parseFloat(startTimeInSeconds) + 1).toFixed(1);
    
    const paramForm = document.getElementById('paramForm');
    let paramHtml = `
      <label>Start Time (s):</label>
      <input type="number" id="startTime" value="${startTimeInSeconds}"><br>

      <label>End Time (s):</label>
      <input type="number" id="endTime" value="${endTime}"><br>

      <label>Text/Info:</label>
      <input type="text" id="textContent" value="${animationName}"><br>
    `;
    paramForm.innerHTML = paramHtml;
    
    const applyParamsBtn = document.getElementById('applyParamsBtn');
    applyParamsBtn.style.display = 'block';
    // Remove old listeners
    applyParamsBtn.replaceWith(applyParamsBtn.cloneNode(true));
    document.getElementById('applyParamsBtn').addEventListener('click', () => {
      applyParameters(animationName);
    });
  }

  function applyParameters(animationName) {
    const startTime = parseFloat(document.getElementById('startTime').value);
    const endTime = parseFloat(document.getElementById('endTime').value);
    const textContent = document.getElementById('textContent').value;
    const duration = parseFloat((endTime - startTime).toFixed(1));

    if(duration < 0.1) {
      alert("Duration too short!");
      return;
    }

    const timelineItem = Array.from(document.querySelectorAll('.timeline-block'))
      .find((elem) => elem.textContent.includes(animationName));
    if (!timelineItem) {
      console.error("Cannot find timeline block for", animationName);
      return;
    }

    timelineItem.style.left = (startTime * 100) + 'px';
    timelineItem.style.width = (duration * 100) + 'px';
    timelineItem.textContent = `${animationName} (${textContent})`;

    // Update data
    const trackIndex = parseInt(timelineItem.dataset.trackIndex, 10);
    const itemIndex = parseInt(timelineItem.dataset.blockIndex, 10);

    timelineData.tracks[trackIndex][itemIndex] = {
      animationName,
      startTime,
      duration,
      textContent
    };

    renderTimeline();
  }

  /**********************************************
   * TIMELINE CLICK
   **********************************************/
  function setupTimelineClick(){
    sel.timelineTracksDiv.addEventListener('click', (e) => {
      if (e.target.classList.contains('timeline-block')) {
        let trackIndex = parseInt(e.target.dataset.trackIndex, 10);
        let blockIndex = parseInt(e.target.dataset.blockIndex, 10);
        let block = Model.getTimelineTracks()[trackIndex][blockIndex];
        if (block) {
          const animLib = Model.getAnimationLibrary();
          let animObj = animLib.find(a => a.id === block.animId);
          View.showParameterForm(block, animObj);
        }
      }
    });
  }

  /**********************************************
   * PARAM FORM
   **********************************************/
  function setupParamForm(){
    sel.applyParamsBtn.addEventListener('click', () => {
      // Stub, handled by applyParameters
    });
  }

  /**********************************************
   * PLAYBACK CONTROLS (with fps)
   **********************************************/
  function setupPlaybackControls(){
    const btnRewind = document.getElementById('btnRewind');
    btnRewind.addEventListener('click', () => {
      console.log("btnRewind");
      currentFrameIndex = 0;
      updateScrubber(getCurrentTime());
      View.updatePreviewCanvas(currentFrameIndex);
      updateCurrentTimeDisplay(getCurrentTime());
    });
    
    const btnBack10 = document.getElementById('btnBack10');
    if(btnBack10){
      btnBack10.addEventListener('click', () => {
        console.log("btnBack10");
        // Go back 10 seconds worth of frames
        currentFrameIndex = Math.max(currentFrameIndex - 10*fps, 0);
        updateScrubber(getCurrentTime());
        View.updatePreviewCanvas(currentFrameIndex);
        updateCurrentTimeDisplay(getCurrentTime());
      });
    }
    
    const btnPlay = document.getElementById('btnPlay');
    btnPlay.addEventListener("mouseup", (e) => {
      if (isPlaying) {
        pausePlayback();
        btnPlay.textContent = "▶️";
      } else {
        startPlayback();
        btnPlay.textContent = "⏸";
      }
    });
    
    const btnForward = document.getElementById('btnForward');
    btnForward.addEventListener('click', () => {
      // Forward 10 seconds of frames
      currentFrameIndex += 10 * fps;
      if (currentFrameIndex > totalDuration * fps) {
        currentFrameIndex = totalDuration * fps;
      }
      updateScrubber(getCurrentTime());
      View.updatePreviewCanvas(currentFrameIndex);
      updateCurrentTimeDisplay(getCurrentTime());
    });
  }

  // Helper to get the current time in seconds
  function getCurrentTime(){
    return currentFrameIndex / fps;
  }

  // Start playback at the chosen fps
  function startPlayback(){
    if(isPlaying) return;
    isPlaying = true;
    const frameInterval = 1000 / fps;

    frameTimer = setInterval(() => {
      currentFrameIndex++;
      if (currentFrameIndex > totalDuration * fps) {
        pausePlayback();
      } else {
        const currentTime = getCurrentTime();
        updateScrubber(currentTime);
        View.updatePreviewCanvas(currentFrameIndex);
        updateCurrentTimeDisplay(currentTime);
      }
    }, frameInterval);
  }
  
  function pausePlayback() {
    if(!isPlaying) return;
    isPlaying = false;
    clearInterval(frameTimer);
    frameTimer = null;
  }

  function stopPlayback(){
    isPlaying = false;
    if(frameTimer){
      clearInterval(frameTimer);
      frameTimer = null;
    }
  }

  /**********************************************
   * SCRUBBER & TIME DISPLAY
   **********************************************/
  function updateScrubber(timeInSeconds) {
    const scrubber = document.getElementById("scrubber");
    const timelineContainer = document.getElementById("timelineContainer");
    const timelineWidth = timelineContainer.scrollWidth;
    const scrubberWidth = scrubber.offsetWidth || 12;

    const fraction = timeInSeconds / totalDuration;
    const newLeft = fraction * (timelineWidth - scrubberWidth);

    scrubber.style.left = newLeft + 'px';
    scrubber.style.top = '0px';
  }

  // Whenever time changes, update the "current time" label (if exists)
  function updateCurrentTimeDisplay(timeInSeconds) {
    if (sel.currentTimeDisplay) {
      sel.currentTimeDisplay.textContent = timeInSeconds.toFixed(2) + 's';
    }
  }

  function initScrubber(){
    const scrubber = createScrubber();
    scrubber.style.zIndex = '100';

    scrubber.addEventListener('mousedown', (e) => {
      e.preventDefault();
      document.addEventListener('mousemove', scrubberDrag);
      document.addEventListener('mouseup', stopScrubberDrag);
    });
  }
  
  function scrubberDrag(e){
    const timelineContainer = document.getElementById("timelineContainer");
    const rect = timelineContainer.getBoundingClientRect();
    const scrubber = document.getElementById("scrubber");
    const timelineWidth = timelineContainer.scrollWidth;
    const scrubberWidth = scrubber.offsetWidth || 12;
    
    let x = e.clientX - rect.left;
    x = Math.max(0, Math.min(x, timelineWidth - scrubberWidth));
    scrubber.style.left = x + 'px';

    // Convert x to fraction => time => frames
    const fraction = x / (timelineWidth - scrubberWidth);
    const timeInSeconds = fraction * totalDuration;

    currentFrameIndex = Math.floor(timeInSeconds * fps);

    // Update preview and the time display
    View.updatePreviewCanvas(currentFrameIndex);
    updateCurrentTimeDisplay(timeInSeconds);
  }
  
  function stopScrubberDrag(){
    document.removeEventListener('mousemove', scrubberDrag);
    document.removeEventListener('mouseup', stopScrubberDrag);
  }

  function createScrubber(){
    let scrubber = document.getElementById("scrubber");
    if(!scrubber){
      scrubber = document.createElement("div");
      scrubber.id = "scrubber";
      scrubber.className = "scrubber";
    }
    return scrubber;
  }

  /**********************************************
   * SEARCH BAR
   **********************************************/
  function setupSearchBar() {
    const searchInput = document.getElementById('animationSearch');
    searchInput.addEventListener('input', onSearchInput);
  }
  
  function onSearchInput(e) {
    const query = e.target.value.toLowerCase();
    requestAnimationFrame(() => {
      const animItems = document.querySelectorAll('.anim-item');
      animItems.forEach(item => {
        const animName = item.dataset.animName.toLowerCase();
        item.style.display = animName.includes(query) ? 'block' : 'none';
      });
    });
  }

  /**********************************************
   * TIMELINE ZOOM (SCALE)
   **********************************************/
  function setupTimelineSlider(){
    const scaleSlider = document.getElementById('scaleSlider');
    if(scaleSlider){
      scaleSlider.addEventListener('input', (e)=>{
        scaleFactor = parseFloat(e.target.value);
        renderTimeline();
        updateScrubber(getCurrentTime());
      });
    }
  }

  /**********************************************
   * MISC BUTTONS
   **********************************************/
  function setupMiscButtons(){
    sel.btnExportMP4.addEventListener('click', onExportMP4);
    sel.btnAddSound.addEventListener('click', onAddSound);
  }

  function onExportMP4(){
    alert("Placeholder for generating MP4. (Alpha)");
  }
  function onAddSound(){
    alert("Placeholder for adding a sound effect. (Alpha)");
  }

  // Return the controller interface
  return {
    init
  };

})();
