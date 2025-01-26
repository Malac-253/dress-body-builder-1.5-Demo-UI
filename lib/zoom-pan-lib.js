/*****************************************************
 * zoom-pan-lib.js
 * 
 * Provides a function `enableZoomPan(svg, scaleExtent)` 
 * that sets up d3 zoom/pan on the given <svg>.
 *****************************************************/
function enableZoomPan(svg, scaleExtent = [0.5, 10]) {
    const zoomBehavior = d3.zoom()
      .scaleExtent(scaleExtent)
      .on("zoom", (event) => {
        svg.selectAll(".zoom-layer").attr("transform", event.transform);
      });
  
    svg.call(zoomBehavior);
  
    function resetView() {
      svg.transition()
        .duration(500)
        .call(zoomBehavior.transform, d3.zoomIdentity);
    }
  
    return { resetView, zoomBehavior };
  }
  