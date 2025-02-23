/***********************************************
 * mvc-model.js (UPDATED)
 *
 * The "Model" portion.
 ***********************************************/

const Model = (function(){

    // Possibly we load from a server or local:
    // This is a placeholder. In a real system, you'd fetch from /api/animations or so.
    // For now, we define them locally:
    let animationLibrary = [
      { 
        id: "anim-text", 
        name: "Add Text", 
        duration: 1.0,
        paramSchema: [
          { key: "textString", label: "Text", type: "string", default: "Hello from POC" },
          { key: "x", label: "X Pos", type: "number", default: 50 },
          { key: "y", label: "Y Pos", type: "number", default: 50 },
          { key: "fontSize", label: "Font Size", type: "number", default: 14 },
          { key: "color", label: "Color", type: "string", default: "#000000" }
        ]
      },
      { 
        id: "anim-walk", 
        name: "Walk Cycle", 
        duration: 2.0,
        paramSchema: [
          { key: "speed", label: "Speed Multiplier", type: "number", default: 1.0 }
        ]
      },
      { 
        id: "anim-wave", 
        name: "Wave Arm", 
        duration: 1.5,
        paramSchema: [
          { key: "intensity", label: "Intensity", type: "number", default: 1.0 }
        ]
      },
      { 
        id: "anim-jump", 
        name: "Jump Up", 
        duration: 2.5,
        paramSchema: []
      }
    ];
  
    // The timeline: multiple tracks 
    let timelineTracks = [
      [],
      [],
      []
    ];
  
    /**
     * This is the big placeholder that merges timeline data,
     * manipulates the hiddenSVG, takes snapshots -> frames.
     * We'll store them in memory or something. 
     */
    function generateFramesForTimeline(){
      console.log("=== GenerateFrames START ===");
  
      // (1) For each block in each track, we call the appropriate function(s)
      // on the hiddenSVG. Possibly we do it incrementally for each frame (time stepping),
      // or we do it "baked" and just gather the final transformation. 
      // This is a placeholder.
  
      // e.g. 
      // For t from 0..someMax, do:
      //    Clear or revert hiddenSVG to initial state
      //    For each block that is active at time t:
      //       find its animId, fetch param, call the real library function 
      //    SnapShot -> store frame
      // 
      // This is purely a stub.
  
      console.log("=== GenerateFrames END (stub) ===");
    }

    function generateUniqueId() {
      return 'id-' + Math.random().toString(36).substr(2, 16);
    }
  
    return {
      //  For animation library
      getAnimationLibrary: function(){
        return animationLibrary;
      },
  
      // Potentially fetch from server if needed:
      loadAnimationsFromServer: function(){
        console.log("Placeholder: would do fetch('/api/animations') then update animationLibrary.");
      },
  
      // For timeline
      getTimelineTracks: function(){
        return timelineTracks;
      },
      addBlockToTrack: function(trackIndex, blockData){
        if(!timelineTracks[trackIndex]){
          console.warn("Invalid track index:", trackIndex);
          return;
        }
        blockData.id = generateUniqueId();
        timelineTracks[trackIndex].push(blockData);
      },
      updateBlockParams: function(trackIndex, blockIndex, newParams){
        let block = timelineTracks[trackIndex][blockIndex];
        if(!block) return;
        block.paramValues = { ...block.paramValues, ...newParams };
      },
  
      generateFramesForTimeline,
      generateUniqueId // Ensure this function is accessible
    };
  
  })();
