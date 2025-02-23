/***********************************************
 * mvc-view.js (UPDATED)
 *
 * The "View" portion — handles DOM creation, updates, etc.
 ***********************************************/

const View = (function(){

    const sel = {
      animItemsContainer: document.getElementById('animationItems'),
      timelineTracksDiv: document.getElementById('timelineTracks'),
      timelineNumbersDiv: document.getElementById('timelineNumbers'), // Added this line
      paramForm: document.getElementById('paramForm'),
      applyParamsBtn: document.getElementById('applyParamsBtn'),
      previewCanvas: document.getElementById('previewCanvas'),
      loadingInfo: document.getElementById('loadingInfo'),
      layersTree: document.getElementById('layersTree')
    };
  
    // We might store some ephemeral "currently selected block info"
    // so we can re-render param form. 
    let currentSelection = null; // { trackIndex, blockIndex, blockRef }
  
    function renderAnimationLibrary(animLibrary){
      sel.animItemsContainer.innerHTML = "";
      animLibrary.forEach(anim => {
        const itemDiv = document.createElement('div');
        itemDiv.className = "anim-item";
        itemDiv.draggable = true;
        itemDiv.dataset.animId = anim.id;
        itemDiv.dataset.animName = anim.name;
        itemDiv.dataset.animDuration = anim.duration;
        itemDiv.textContent = anim.name + " ( " + anim.duration + "s )";
        sel.animItemsContainer.appendChild(itemDiv);
      });
    }
  
    function renderTimeline(tracksData) {
      sel.timelineTracksDiv.innerHTML = "";
      sel.timelineNumbersDiv.innerHTML = ""; // Clear existing markers and labels
      const markerCount = 20; // extend to 20 seconds
    
      tracksData.forEach((trackBlocks, trackIndex) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = "timeline-track";
        rowDiv.dataset.trackIndex = trackIndex;
    
        trackBlocks.forEach((block, blockIndex) => {
          const blockDiv = document.createElement('div');
          blockDiv.className = "timeline-block";
          blockDiv.textContent = block.animId;
          blockDiv.style.left = (block.startTime * 50) + "px";
          blockDiv.style.width = ((block.endTime - block.startTime) * 50) + "px";
          blockDiv.dataset.trackIndex = trackIndex;
          blockDiv.dataset.blockIndex = blockIndex;
          rowDiv.appendChild(blockDiv);
        });
    
        sel.timelineTracksDiv.appendChild(rowDiv);
      });
    
      // Helper to format seconds as MM:SS:MS (milliseconds always "000")
      function formatTime(seconds) {
        let minutes = Math.floor(seconds / 60);
        let secs = seconds % 60;
        const pad = num => num.toString().padStart(2, "0");
        return `${pad(minutes)}:${pad(secs)}:000`;
      }
    
      // Create markers and labels for markerCount seconds
      for (let i = 0; i < markerCount; i++) {
        const timeMarker = document.createElement('div');
        timeMarker.className = "timeline-time-marker";
        timeMarker.style.left = (i * 50) + "px";
        sel.timelineNumbersDiv.appendChild(timeMarker);
    
        const timeLabel = document.createElement('div');
        timeLabel.className = "timeline-time-label";
        timeLabel.style.left = (i * 50) + "px";
        timeLabel.textContent = formatTime(i);
        sel.timelineNumbersDiv.appendChild(timeLabel);
    
        const horizontalLine = document.createElement('div');
        horizontalLine.className = "timeline-horizontal-line";
        horizontalLine.style.left = (i * 50) + "px";
        sel.timelineTracksDiv.appendChild(horizontalLine);
      }
    }
  
    /**
     * Show the parameter form for a block that references an animation with paramSchema.
     */
    function showParameterForm(block) {
      if (!block) {
        sel.paramForm.innerHTML = "<p>Select an item to see parameters.</p>";
        sel.applyParamsBtn.style.display = "none";
        return;
      }
      sel.applyParamsBtn.style.display = "inline-block";
    
      let paramsHtml = '';
      for (const [key, value] of Object.entries(block.paramValues || {})) {
        paramsHtml += `<label>${key}: <input type="text" id="param-${key}" value="${value}"></label><br>`;
      }
    
      sel.paramForm.innerHTML = `
        ${paramsHtml}
        <p>Animation ID: ${block.animId}</p>
        <p>Duration: ${block.endTime - block.startTime}s</p>
      `;
    }
  
    /**
     * Read param values from the input fields in paramForm
     */
    function getFormValues(){
      const inputs = sel.paramForm.querySelectorAll('input[data-paramkey]');
      let result = {};
      inputs.forEach(inp => {
        let key = inp.dataset.paramkey;
        let val = inp.value;
        if(inp.type === "number"){
          result[key] = parseFloat(val) || 0;
        } else {
          result[key] = val;
        }
      });
      return result;
    }
  
    function showLoadingIndicator(show){
      sel.loadingInfo.style.display = show ? "inline-block" : "none";
    }
  
    function updatePreviewCanvas(frameIndex){
      const ctx = sel.previewCanvas.getContext("2d");
      ctx.clearRect(0,0, sel.previewCanvas.width, sel.previewCanvas.height);
      // Just a silly color effect
      ctx.fillStyle = `rgb(${(frameIndex * 12) % 256}, 100, 150)`;
      ctx.fillRect(0,0, sel.previewCanvas.width, sel.previewCanvas.height);
  
      ctx.fillStyle = "#fff";
      ctx.fillText(`Frame ${frameIndex}`, 20, 20);
    }
  
    function updateLayersTree(htmlContent){
      sel.layersTree.innerHTML = htmlContent;
    }
  
    /* Provide a means for the Controller to see what block is currently selected (if any). */
    function getCurrentSelection(){ 
      return currentSelection;
    }
  
    return {
      renderAnimationLibrary,
      renderTimeline,
      showParameterForm,
      getFormValues,
      showLoadingIndicator,
      updatePreviewCanvas,
      updateLayersTree,
      getCurrentSelection
    };
  
  })();
