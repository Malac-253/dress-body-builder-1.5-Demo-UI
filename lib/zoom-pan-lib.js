/*****************************************************
 * zoom-pan-lib.js
 * 
 * Provides a function `enableZoomPan(svg, scaleExtent)` 
 * that sets up d3 zoom/pan on the given <svg>.
 *****************************************************/
function enableZoomPan(svg, scaleExtent=[0.5, 10]) {
    const zoomBehavior = d3.zoom()
      .scaleExtent(scaleExtent)
      .on("zoom", (event) => {
        // We'll transform everything inside <svg>, 
        // so let's assume we group <g> for main shapes:
        svg.selectAll(".zoom-layer").attr("transform", event.transform);
      });
  
    // If there's no <g class="zoom-layer">, create one and move the shapes inside it
    // OR ensure your shapes are in .zoom-layer from the start.
    // For simplicity, we'll not auto-move shapes. We'll assume the caller does it.
    
    svg.call(zoomBehavior);
  
    function resetView() {
      svg.transition()
        .duration(500)
        .call(zoomBehavior.transform, d3.zoomIdentity);
    }
  
    return { resetView };
  }
  