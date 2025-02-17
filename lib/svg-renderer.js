/**************************************************
 * svg-renderer.js
 *
 * Now we:
 *  1) For each sub-key in partData that has `_layers`,
 *  2) For each layerKey that starts with "main",
 *  3) For each path item => draw fill in first <svg>.
 *  4) If line group is not false => create second <svg> for strokes.
 **************************************************/
// Suppose we rely on zoom-pan-lib's enableZoomPan(...) if you want.

function element_linearGradient(Outparent, id, x1, y1, x2, y2, FillandOpac) {
  function clampPercent(v) {
    if (v < 0) return "0%";
    if (v > 100) return "100%";
    return v + "%";
  }
  const x1p = clampPercent(x1), y1p = clampPercent(y1);
  const x2p = clampPercent(x2), y2p = clampPercent(y2);

  const defs = Outparent.select("defs");
  if (defs.empty()) {
    Outparent.append("defs");
  }

  const grad = Outparent.select("defs")
    .append("linearGradient")
    .attr("id", id)
    .attr("x1", x1p)
    .attr("y1", y1p)
    .attr("x2", x2p)
    .attr("y2", y2p);

  FillandOpac.forEach(item => {
    const style_fill = `stop-color:${item.color};`;
    const style_opac = `stop-opacity:${item.opacity};`;
    grad
      .append("stop")
      .attr("offset", item.offset + "%")
      .attr("style", style_fill + style_opac);
  });

  return grad;
}

function element_radialGradient(Outparent, id, FillandOpac) {
  const defs = Outparent.select("defs");
  if (defs.empty()) {
    Outparent.append("defs");
  }
  const grad = Outparent.select("defs")
    .append("radialGradient")
    .attr("id", id);

  FillandOpac.forEach(item => {
    const style_fill = `stop-color:${item.color};`;
    const style_opac = `stop-opacity:${item.opacity};`;
    grad
      .append("stop")
      .attr("offset", item.offset + "%")
      .attr("style", style_fill + style_opac);
  });

  return grad;
}

/**
 * Renders all "main*" layers in all sub-objects of `partData`.
 * Draws both fill and line in one <svg> so lines overlay fills.
 * Auto-zooms to the bounding box of the drawn paths so they're front and center.
 * 
 * @param {string} containerSelector - e.g. "#big-svg-container"
 * @param {object} partData - e.g. { "Eyes": {"_layers": {"main":[...], "mainFace":[...]}, ...}, "Mouth": {...} }
 * @param {object} colorData - e.g. { _color_group:[], _line_group: [] }
 * @param {string} fallbackName - e.g. "eyes"
 *
 * Returns { resetViewFill, resetViewLine } for resetting each <svg> 
 * (both references point to the same reset function).
 */
function renderGraphicalPartSVG(containerSelector, partData, colorData, fallbackName) {
  const container = d3.select(containerSelector);
  if (container.empty()) {
    console.error("renderGraphicalPartSVG: container not found:", containerSelector);
    return {};
  }

  // Create <svg> once
  const svg = container.append("svg")
    .attr("width", "100%") // Make SVG responsive to container size
    .attr("height", "100%")
    .attr("viewBox", "0 0 700 700")
    .attr("preserveAspectRatio", "xMidYMid meet");

  // We'll place all paths inside a <g class="zoom-layer">
  const mainLayer = svg.append("g").attr("class", "zoom-layer");

  // Gather sub-keys that have `_layers`
  const subKeys = Object.keys(partData).filter(k => {
    const obj = partData[k];
    return obj && typeof obj === 'object' && obj._layers;
  });

  // Draw fill+line shapes
  subKeys.forEach(sk => {
    // Find layerKeys that start with "main"
    const layerObj = partData[sk]._layers;
    const layerKeys = Object.keys(layerObj).filter(lk => lk.toLowerCase().startsWith("main"));

    layerKeys.forEach(lk => {
      const pathsArr = layerObj[lk] || [];
      pathsArr.forEach((item, idx) => {
        if (!item?._d_value) return;

        const grpIndex = (item._cd_group || 1) - 1;

        // 1) FILL logic
        let fillUrl = "silver";
        const colorInfo = colorData?._color_group?.[grpIndex];
        if (colorInfo) {
          const gradId = `${containerSelector.replace('#','')}-grad-fill-${sk}-${lk}-${idx}`;
          if (colorInfo.type === 1) {
            // Linear gradient
            const x1 = (colorInfo.gradient?.x1 ?? 0) * 100;
            const y1 = (colorInfo.gradient?.y1 ?? 0) * 100;
            const x2 = (colorInfo.gradient?.x2 ?? 0) * 100;
            const y2 = (colorInfo.gradient?.y2 ?? 1) * 100;
            element_linearGradient(svg, gradId, x1, y1, x2, y2, colorInfo.color);
            fillUrl = `url(#${gradId})`;
          } else if (colorInfo.type === 2) {
            // Radial gradient
            element_radialGradient(svg, gradId, colorInfo.color);
            fillUrl = `url(#${gradId})`;
          } else {
            // Solid color
            fillUrl = colorInfo.color?.[0]?.color || "gray";
          }
        }
        // Draw fill path
        mainLayer.append("path")
          .attr("d", item._d_value)
          .attr("fill", fillUrl)
          .attr("stroke", "none");

        // 2) LINE logic
        const lineInfo = colorData?._line_group?.[grpIndex];
        if (lineInfo && lineInfo !== false) {
          let strokeUrl = "black";
          const gradIdLine = `${containerSelector.replace('#','')}-grad-line-${sk}-${lk}-${idx}`;

          if (lineInfo.color) {
            if (lineInfo.type === 1) {
              // Linear gradient
              const x1 = (lineInfo.gradient?.x1 ?? 0) * 100;
              const y1 = (lineInfo.gradient?.y1 ?? 0) * 100;
              const x2 = (lineInfo.gradient?.x2 ?? 0) * 100;
              const y2 = (lineInfo.gradient?.y2 ?? 1) * 100;
              element_linearGradient(svg, gradIdLine, x1, y1, x2, y2, lineInfo.color);
              strokeUrl = `url(#${gradIdLine})`;
            } else if (lineInfo.type === 2) {
              // Radial gradient
              element_radialGradient(svg, gradIdLine, lineInfo.color);
              strokeUrl = `url(#${gradIdLine})`;
            } else {
              // Solid color
              strokeUrl = lineInfo.color?.[0]?.color || "black";
            }
          }
          // Draw line path
          mainLayer.append("path")
            .attr("d", item._d_value)
            .attr("fill", "none")
            .attr("stroke", strokeUrl)
            .attr("stroke-width", lineInfo.strokeWidth ?? 1)
            .attr("stroke-opacity", lineInfo.opacity ?? 1);
        }
      });
    });
  });

  // Attach zoom/pan and get zoom behavior
  const { resetView, zoomBehavior } = enableZoomPan(svg);

  // Auto-zoom to content once shapes are in place
  // Using requestAnimationFrame to ensure DOM is updated
  requestAnimationFrame(() => {
    autoZoomToContent(svg, mainLayer, zoomBehavior);
  });

  return { resetViewFill: resetView, resetViewLine: resetView };
}

/**
 * Auto-zoom to the bounding box of all shapes in `layer`.
 * This ensures the item(s) are visible and centered.
 *
 * @param {object} svg - the D3 selection of the svg element
 * @param {object} layer - the D3 selection of the <g class="zoom-layer">
 * @param {object} zoomBehavior - the d3.zoom() behavior
 */
function autoZoomToContent(svg, layer, zoomBehavior) {
  const box = layer.node().getBBox();
  if (box.width === 0 || box.height === 0) {
    console.warn("autoZoomToContent: bounding box is zero => no shapes or not rendered yet.");
    return;
  }

  const svgSize = 700; 
  const marginFactor = 0.1; 

  // Calculate scale to fit the bounding box with margins
  const scale = Math.min(
    (svgSize * (1 - marginFactor)) / box.width,
    (svgSize * (1 - marginFactor)) / box.height
  );

  // Calculate translation to center the bounding box
  const offsetX = (svgSize - box.width * scale) / 2 - box.x * scale;
  const offsetY = (svgSize - box.height * scale) / 2 - box.y * scale;

  // Build the transform
  const transform = d3.zoomIdentity
    .translate(offsetX, offsetY)
    .scale(scale);

  // Apply the transform via the existing zoom behavior with a transition
  svg.transition()
    .duration(750)
    .call(zoomBehavior.transform, transform);
}

