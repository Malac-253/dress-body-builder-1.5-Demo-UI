/****************************************************
 * single-part.js
 * Supports two URL params now:
 *   • part_id=123          ← REQUIRED
 *   • color_design_id=42   ← OPTIONAL
 * 
 * This page shows:
 *   - The name/author of the part
 *   - A big <svg> in #big-svg-container
 *   - Thumbs up/down toggles
 *   - Raw JSON dump
 ****************************************************/


function getQueryParam(key) {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}
const getPartIdFromURL        = () => getQueryParam("part_id");
const getColorDesignIdFromURL = () => getQueryParam("color_id");  // ★NEW★

// 2) Fetch the single part
async function fetchOnePart(id) {
  const url = `https://dress-body-builder-2.onrender.com/api/graphical-parts/${id}/?access_code=${ACCESS_CODE}`;
  const res = await fetch(url, { headers: { Authorization: `Token ${GUEST_USER_TOKEN}` }});
  if (!res.ok) throw new Error("Failed to fetch part " + id);
  return res.json();
}

// 3) Fetch color designs
async function fetchColorDesigns(partId) {
  const qs  = new URLSearchParams({ graphical_part_id: partId, access_code: ACCESS_CODE });
  const url = `https://dress-body-builder-2.onrender.com/api/color-designs/?${qs}`;
  const res = await fetch(url, { headers: { Authorization: `Token ${GUEST_USER_TOKEN}` }});
  if (!res.ok) return [];
  return res.json();
}

// ★NEW★ – fetch a single colour-design by id
async function fetchOneColorDesign(id) {
  const url = `https://dress-body-builder-2.onrender.com/api/color-designs/${id}/?access_code=${ACCESS_CODE}`;
  const res = await fetch(url, { headers: { Authorization: `Token ${GUEST_USER_TOKEN}` } });
  if (!res.ok) throw new Error("Failed to fetch colour design " + id);
  return res.json();
}


// 4) Render function
async function renderSinglePart() {
  const partId = getPartIdFromURL();
  const forcedCdIdRaw  = getColorDesignIdFromURL();         // ★NEW★
  const forcedCdId     = forcedCdIdRaw ? Number(forcedCdIdRaw) : null;
  if (!partId) {
    document.getElementById("part-title").textContent = "No part_id specified";
    return;
  }

  let partData;
  try {
    partData = await fetchOnePart(partId);
  } catch (err) {
    console.error(err);
    document.getElementById("part-title").textContent = "Error fetching part";
    return;
  }

  document.getElementById("part-title").textContent = partData.name;
  //document.getElementById("part-author").textContent = `Author: ${partData.owned_by ?? "???"}`;
  document.getElementById("part-author").textContent = `Author: B3 Lite & Amote Studio`;
  
  // raw JSON
  document.getElementById("json-output").textContent = JSON.stringify(partData, null, 2);

  let designs = [];

  let usedDesign = null;

  if (forcedCdId) {
    try {
      const forcedDesign = await fetchOneColorDesign(forcedCdId);
      if (String(forcedDesign.graphical_part_id) === String(partId)) {
        usedDesign = forcedDesign;
        // Add it to the designs array if it wasn’t in the list (for completeness)
        if (!designs.some(d => d.id === forcedCdId)) designs.push(forcedDesign);
      } else {
        console.warn(
          `color_design_id=${forcedCdId} does not belong to part_id=${partId}. Ignoring parameter.`
        );
      }
    } catch (e) {
      console.warn("Could not fetch forced colour design:", e);
    }
  }else{
    try {
      designs = await fetchColorDesigns(partId);
    } catch {}

    if (partData.standard_color_design) {
      usedDesign = designs.find(cd => cd.color_design_id === partData.standard_color_design);
    }

    if (!usedDesign && designs.length > 0) usedDesign = designs[0];
  }

  if (usedDesign) {
    document.getElementById("color-json-output").textContent = JSON.stringify(usedDesign, null, 2);
  }


  const colorData = usedDesign ? usedDesign.color_data : { _line_group:[], _color_group:[] };

  // After we fetch `partData` and `usedDesign`, we fill #additional-info:
  const infoElem = document.getElementById("additional-info");
  const partDesc = partData.description ?? "None";
  const partOwnerDate = partData.ownership_date ?? "Unknown Date";

  let cdId = "", cdName = "";
  if (usedDesign) {
    cdId = usedDesign.color_design_id;
    cdName = usedDesign.name;
  }

  infoElem.innerHTML = `
    <p><strong>Graphical Part ID:</strong> ${partId}</p>
    <p><strong>Name:</strong> ${partData.name}</p>
    <p><strong>Description:</strong> ${partDesc}</p>
    <p><strong>Ownership Date:</strong> ${partOwnerDate}</p>
    <hr>
    <p><strong>Color Design ID:</strong> ${cdId}</p>
    <p><strong>Color Design Name:</strong> ${cdName}</p>
  `;

  // Render big svg
  const fallbackName = "unknown";
  const { resetViewFill, resetViewLine } = renderGraphicalPartSVG("#big-svg-container", partData.graphical_data, colorData, fallbackName);

  // Hook up reset
  const resetBtn = document.getElementById("reset-view-btn");
  resetBtn.onclick = () => {
    if (resetViewFill) resetViewFill();
    if (resetViewLine) resetViewLine();
  };
}

// Like/Dislike => like => red, dislike => teal
function setupLikeDislike() {
  const likeBtn = document.getElementById("like-button");
  const dislikeBtn = document.getElementById("dislike-button");

  let liked = false;
  let disliked = false;

  likeBtn.onclick = () => {
    liked = !liked;
    disliked = false;
    console.log(liked ? "You liked this item." : "Removed like.");
    likeBtn.classList.toggle("like-active", liked);
    dislikeBtn.classList.remove("dislike-active");
  };

  dislikeBtn.onclick = () => {
    disliked = !disliked;
    liked = false;
    console.log(disliked ? "You disliked this item." : "Removed dislike.");
    dislikeBtn.classList.toggle("dislike-active", disliked);
    likeBtn.classList.remove("like-active");
  };
}

(async function init() {
  setupLikeDislike();
  await renderSinglePart();
})();
