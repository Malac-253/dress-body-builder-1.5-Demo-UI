/**************************************************
 * svg-renderer.js
 **************************************************/

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
 * Renders the main paths of a GraphicalPart's 'main' layer.
 * 
 * @param {string} containerSelector - e.g. "#svgContainer-9"
 * @param {object} partData - e.g. { "Capes": { "_layers": { "main": [...] } } }
 * @param {object} colorData - e.g. { "_color_group": [...], "_line_group": [...] }
 * @param {string} typeName - e.g. "eyes", "mouth", "capes", etc. (the row's name)
 */
async function renderGraphicalPartSVG(containerSelector, partData, colorData, typeName) {
  console.log("renderGraphicalPartSVG containerSelector =", containerSelector);

  let container = d3.select(containerSelector);
  console.log("selection node =", container.node());

  // 1) Attempt to find the sub-object in partData that matches 'typeName' ignoring case
  const allKeys = Object.keys(partData);
  let matchedKey = allKeys.find(k => k.toLowerCase() === typeName.toLowerCase());

  // 2) If none found, fallback to the first key
  if (!matchedKey && allKeys.length > 0) {
    matchedKey = allKeys[0];
  }

  console.log(`For typeName="${typeName}", matchedKey="${matchedKey}" in partData:`, partData);

  if (!matchedKey) {
    // No sub-object => can't render anything
    return;
  }

  // 3) Grab the "main" array
  const mainArray = partData[matchedKey]?._layers?.main || [];
  console.log("mainArray:", mainArray);

  // 4) Build <svg> inside container
  const width = 140, height = 130;
  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", "50 150 300 300");

  // For each path in mainArray
  mainArray.forEach((item, idx) => {
    if (!item || !item._d_value) return;

    const grpIndex = (item._cd_group || 1) - 1;
    const colorInfo = colorData?._color_group?.[grpIndex];
    let fillUrl = "silver";

    if (colorInfo) {
      const gradId = `${containerSelector.replace('#','')}-grad-${idx}`;
      if (colorInfo.type === 1) {
        // linear
        const x1 = (colorInfo.gradient?.x1 ?? 0) * 100;
        const y1 = (colorInfo.gradient?.y1 ?? 0) * 100;
        const x2 = (colorInfo.gradient?.x2 ?? 0) * 100;
        const y2 = (colorInfo.gradient?.y2 ?? 1) * 100;
        element_linearGradient(svg, gradId, x1, y1, x2, y2, colorInfo.color);
        fillUrl = `url(#${gradId})`;
      } else if (colorInfo.type === 2) {
        element_radialGradient(svg, gradId, colorInfo.color);
        fillUrl = `url(#${gradId})`;
      } else {
        // fallback
        fillUrl = colorInfo.color?.[0]?.color || "gray";
      }
    }

    svg.append("path")
      .attr("d", item._d_value)
      .attr("fill", fillUrl)
      .attr("stroke", "none");
  });
}
