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








// ————————————————————————————————————————————————————————————————
// JSON helper: deep-clone with color-design IDs stripped
function stripColorDesignIds(input) {
  const kill = new Set(["id", "_id", "design_id", "colorDesignId"]);
  const isObj = v => v && typeof v === "object" && !Array.isArray(v);
  const dive = (v) => {
    if (Array.isArray(v)) return v.map(dive);
    if (isObj(v)) {
      const out = {};
      for (const [k, val] of Object.entries(v)) {
        if (kill.has(k)) continue;
        out[k] = dive(val);
      }
      return out;
    }
    return v;
  };
  return dive(input);
}

// Simple schema-ish checks (non-breaking, just for user feedback)
function validatePartGraph(graph) {
  // Accept either the “graphical_data” object itself or a full API object
  const g = graph && graph.graphical_data ? graph.graphical_data : graph;
  const ok =
    g && typeof g === "object" &&
    (
      g._parts || g.parts || g.graph || g._layers ||
      // very permissive: allow objects that contain "main"-like layers in nested structures
      Object.keys(g).some(k => /main/i.test(k))
    );
  return { ok, msg: ok ? "Looks like a valid graph payload" : "Doesn’t look like a graph payload" };
}

function validateColorDesign(color) {
  const c = color && color.color_data ? color.color_data : color;
  const ok = c && typeof c === "object" && (Array.isArray(c._color_group) || Array.isArray(c._line_group));
  return { ok, msg: ok ? "Color groups present" : "Missing _color_group/_line_group" };
}

// Debounce helper for “Live” mode
function debounce(fn, ms = 350) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// Build a compact editor next to a given <pre> block
function mountJsonEditor({
  preEl,                       // <pre> to sit next to
  initialValue,                // JSON object
  label,                       // "Part JSON" | "Color Design JSON"
  validate,                    // validator function -> {ok,msg}
  onApply,                     // (jsonObj) => void  (you re-render here)
  onFormat,                    // optional prettifier (defaults to JSON.stringify)
  applyOnCtrlEnter = true,     // Ctrl/Cmd+Enter quick apply
  liveDisabled = true,         // default “Live” OFF
}) {
  const container = document.createElement("div");
  container.className = "editor-wrap";

  const toolbar = document.createElement("div");
  toolbar.className = "editor-toolbar";

  const editBtn = document.createElement("button");
  editBtn.textContent = `Edit ${label}`;
  editBtn.type = "button";

  const applyBtn = document.createElement("button");
  applyBtn.textContent = `Apply ${label}`;
  applyBtn.type = "button";

  const fmtBtn = document.createElement("button");
  fmtBtn.textContent = "Beautify";
  fmtBtn.type = "button";

  const liveLabel = document.createElement("label");
  const liveCb = document.createElement("input");
  liveCb.type = "checkbox";
  liveCb.checked = !liveDisabled;
  const liveText = document.createElement("span");
  liveText.textContent = " Live (debounced)";
  liveLabel.append(liveCb, liveText);

  const enterHint = document.createElement("span");
  enterHint.className = "small";
  enterHint.textContent = "Ctrl/Cmd+Enter applies";

  const status = document.createElement("span");
  status.className = "status";

  toolbar.append(editBtn, applyBtn, fmtBtn, liveLabel, enterHint, status);

  const ta = document.createElement("textarea");
  ta.className = "editor-ta";
  ta.spellcheck = false;

  const stringify = onFormat || ((v) => JSON.stringify(v, null, 2));
  const setInitial = (obj) => { ta.value = stringify(obj ?? {}); pingValidate(); };

  // show/hide editor
  let open = false;
  editBtn.onclick = () => {
    open = !open;
    ta.style.display = open ? "block" : "none";
  };

  // format
  fmtBtn.onclick = () => {
    try {
      const obj = JSON.parse(ta.value);
      ta.value = stringify(obj);
      pingValidate();
    } catch (e) {
      // keep status red; no throw
    }
  };

  // validate + color
  function pingValidate() {
    try {
      const obj = JSON.parse(ta.value);
      const { ok, msg } = validate(obj);
      status.textContent = ok ? `✓ ${msg}` : `• ${msg}`;
      status.className = "status " + (ok ? "ok" : "err");
      return ok;
    } catch (e) {
      status.textContent = "JSON error: " + e.message;
      status.className = "status err";
      return false;
    }
  }

  ta.addEventListener("input", () => {
    const ok = pingValidate();
    if (liveCb.checked && ok) debouncedApply();
  });

  // apply
  const doApply = () => {
    try {
      let obj = JSON.parse(ta.value);
      onApply(obj);
      pingValidate();
    } catch (e) {
      status.textContent = "Apply failed: " + e.message;
      status.className = "status err";
    }
  };
  applyBtn.onclick = doApply;

  // Ctrl/Cmd+Enter apply
  if (applyOnCtrlEnter) {
    ta.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        doApply();
      }
    });
  }

  const debouncedApply = debounce(doApply, 400);

  container.append(toolbar, ta);
  preEl.parentNode.insertBefore(container, preEl); // mount right before the <pre>
  setInitial(initialValue);

  // reflect live state on container appearance
  const setLiveClass = () => {
    if (liveCb.checked) container.classList.add("live");
    else container.classList.remove("live");
  };
  setLiveClass();
  liveCb.onchange = setLiveClass;

  return { setValue: setInitial, getTextArea: () => ta };
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

  console.log(partData); //.partData.is_amote_component == tur

  document.getElementById("part-title").textContent = partData.name;
  //document.getElementById("part-author").textContent = `Author: ${partData.owned_by ?? "???"}`;
  document.getElementById("part-author").textContent = `Author: B3 Lite & Amote Studio`;
  
  // raw JSON
  document.getElementById("json-output").textContent = JSON.stringify(partData, null, 2);

  let designs = [];
  let usedDesign = null;

  // ===== AMOTE OVERRIDE BLOCK =====
  // If this part is an Amote component, allow using a color design even if it belongs to a different part.
  if (true) {
    try {
      if (forcedCdId) {
        // Use the forced color design outright, skipping the part-ownership check
        const forcedDesign = await fetchOneColorDesign(forcedCdId);
        usedDesign = forcedDesign;
        if (!designs.some(d => d.color_design_id === forcedDesign.color_design_id)) {
          designs.push(forcedDesign);
        }
      } else if (partData.standard_color_design) {
        // Fetch the standard color design by ID directly, skipping the part-ownership check
        const stdDesign = await fetchOneColorDesign(partData.standard_color_design);
        usedDesign = stdDesign;
        if (!designs.some(d => d.color_design_id === stdDesign.color_design_id)) {
          designs.push(stdDesign);
        }
      } else {
        // No forced ID and no standard specified; fall back to the normal per-part fetch
        designs = await fetchColorDesigns(partId);
        if (designs.length > 0) usedDesign = designs[0];
      }
    } catch (e) {
      console.warn("Amote override: could not fetch color design directly; falling back.", e);
      try {
        designs = await fetchColorDesigns(partId);
        if (partData.standard_color_design) {
          usedDesign = designs.find(cd => cd.color_design_id === partData.standard_color_design) || designs[0] || null;
        } else {
          usedDesign = designs[0] || null;
        }
      } catch {}
    }
  } else {
    // ===== NORMAL (non-amote) FLOW =====
    if (forcedCdId) {
      try {
        const forcedDesign = await fetchOneColorDesign(forcedCdId);
        if (String(forcedDesign.graphical_part_id) === String(partId)) {
          usedDesign = forcedDesign;
          if (!designs.some(d => d.color_design_id === forcedCdId)) designs.push(forcedDesign);
        } else {
          console.warn(
            `color_design_id=${forcedCdId} does not belong to part_id=${partId}. Ignoring parameter.`
          );
        }
      } catch (e) {
        console.warn("Could not fetch forced colour design:", e);
      }
    } else {
      try {
        designs = await fetchColorDesigns(partId);
      } catch {}

      if (partData.standard_color_design) {
        usedDesign = designs.find(cd => cd.color_design_id === partData.standard_color_design) || null;
      }
      if (!usedDesign && designs.length > 0) usedDesign = designs[0];
    }
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




  
  // Grab the existing raw JSON <pre> blocks
const partPre   = document.getElementById("json-output");
const colorPre  = document.getElementById("color-json-output");

// Keep the pristine originals (so "reset" elsewhere still works)
let currentGraph = partData.graphical_data ?? partData ?? {};
let currentColor = colorData ?? {};

// A single re-render function that mimics your normal pipeline
function reRender(graphObj, colorObj, from = "edited") {
  // Allow user to paste the whole API object; extract .graphical_data if present
  const graphPayload = graphObj && graphObj.graphical_data ? graphObj.graphical_data : graphObj;
  // Ignore IDs in color design
  const colorPayload = stripColorDesignIds(
    (colorObj && colorObj.color_data) ? colorObj.color_data : colorObj
  );

  // Clear old SVG
  d3.select("#big-svg-container").html("");

  // Use the same renderer you already call
  renderGraphicalPartSVG("#big-svg-container", graphPayload, colorPayload, from);

  // Also refresh the visible raw <pre> blocks so they mirror the active state
  if (partPre)  partPre.textContent  = JSON.stringify({ graphical_data: graphPayload }, null, 2);
  if (colorPre) colorPre.textContent = JSON.stringify({ color_data: colorPayload }, null, 2);

  // Keep in memory for subsequent edits
  currentGraph = graphPayload;
  currentColor = colorPayload;
}

// Mount the two editors right next to their raw JSON blocks
const partEditor = mountJsonEditor({
  preEl: partPre,
  initialValue: currentGraph,
  label: "Part JSON",
  validate: validatePartGraph,
  onApply: (obj) => reRender(obj, currentColor, "edited-part"),
  liveDisabled: true
});

const colorEditor = mountJsonEditor({
  preEl: colorPre,
  initialValue: currentColor,
  label: "Color Design JSON",
  validate: validateColorDesign,
  onApply: (obj) => reRender(currentGraph, obj, "edited-color"),
  liveDisabled: true
});





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
