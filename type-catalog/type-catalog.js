/********************************************
 * type-catalog.js
 *
 * - read type_id from URL
 * - fetch the type meta (name / description / compartment)
 * - fetch ALL parts for that type, in numeric chunks
 * - render each part cell with its own async color-design + SVG load
 *
 * Result:
 *   • You see parts appear incrementally
 *   • Each part's render pipeline is its own promise
 ********************************************/

// 1) Read type_id from the query string
function getTypeIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("type_id");
}

// 2) Fetch a single GraphicalPartType (for header)
async function fetchGraphicalPartType(typeId) {
  const url = `${API_BASE}graphical-part-type/${typeId}/?access_code=${ACCESS_CODE}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Token ${GUEST_USER_TOKEN}`,
    },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch GraphicalPartType " + typeId);
  }
  return res.json();
}

// 3) Fetch parts for a given set of type_number values
//    e.g. inArray = [1,2,3,...,15]
async function fetchPartsForTypeNumberIn(typeId, inArray) {
  if (!Array.isArray(inArray) || inArray.length === 0) return [];
  const inParam = inArray.join(",");
  const url = `${API_BASE}graphical-parts/?graphical_type_id=${typeId}&type_number__in=${inParam}&access_code=${ACCESS_CODE}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Token ${GUEST_USER_TOKEN}`,
    },
  });
  if (!res.ok) {
    throw new Error(
      `Failed to fetch GraphicalParts with type_number__in=[${inParam}] for typeId=${typeId}`
    );
  }
  return res.json(); // array of parts
}

// 4) Per-part color designs
async function fetchColorDesignsForPart(partId) {
  const url = `${API_BASE}color-designs/?graphical_part_id=${partId}&access_code=${ACCESS_CODE}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Token ${GUEST_USER_TOKEN}`,
    },
  });
  if (!res.ok) return [];
  return res.json();
}

/**
 * Build the DOM cell for a single part and append it to the grid.
 * Returns the containerId + resetBtn so we can hydrate it later.
 */
function createTypeCell(partObj, typeObj, containerEl) {
  const cell = document.createElement("div");
  cell.className = "type-cell";

  // (A) SVG container
  const svgContainer = document.createElement("div");
  svgContainer.className = "svg-container";
  const containerId = `svgContainer-${partObj.graphical_part_id}`;
  svgContainer.id = containerId;
  cell.appendChild(svgContainer);

  // (B) Part name + link to single-part page
  const pName = document.createElement("p");
  pName.className = "part-name";

  const anchor = document.createElement("a");
  anchor.href = `../single-part/single-part.html?part_id=${partObj.graphical_part_id}`;

  // Use global TARGET if present (same pattern as grand-catalog)
  if (typeof TARGET !== "undefined") {
    anchor.target = TARGET;
  }

  anchor.textContent = partObj.name;
  pName.appendChild(anchor);
  cell.appendChild(pName);

  // (C) Author line
  const authorLine = document.createElement("p");
  authorLine.className = "author-line";
  // authorLine.textContent = `Author: ${partObj.owned_by ?? "???"}`;
  authorLine.textContent = "Author: B3 Lite & Amote Studio";
  cell.appendChild(authorLine);

  // (D) Reset View button
  const resetBtn = document.createElement("button");
  resetBtn.className = "reset-btn";
  resetBtn.textContent = "Reset View";
  cell.appendChild(resetBtn);

  // Attach cell to the grid right away (before colors / SVG)
  containerEl.appendChild(cell);

  return { containerId, resetBtn };
}

/**
 * Given a part and its already-created DOM cell, fetch color designs
 * and render the SVG. This is per-part and runs as its own async pipeline.
 */
async function hydrateTypeCellWithColorAndSVG(partObj, typeObj, containerId, resetBtn) {
  let designs = [];
  try {
    designs = await fetchColorDesignsForPart(partObj.graphical_part_id);
  } catch (err) {
    console.warn("No color designs for part", partObj.name, err);
    designs = [];
  }

  // Pick the design:
  //  1) standard_color_design if present,
  //  2) else first one,
  //  3) else empty fallback
  let usedDesign = null;
  if (partObj.standard_color_design) {
    usedDesign =
      designs.find(cd => cd.color_design_id === partObj.standard_color_design) || null;
  }
  if (!usedDesign && designs.length > 0) {
    usedDesign = designs[0];
  }

  const colorData = usedDesign
    ? usedDesign.color_data
    : { _line_group: [], _color_group: [] };

  if (!partObj.graphical_data) {
    console.warn("Part has no graphical_data:", partObj);
    return;
  }

  try {
    const guessName =
      (typeObj && typeObj.name && String(typeObj.name).toLowerCase()) || "unknown";

    const { resetViewFill, resetViewLine } = renderGraphicalPartSVG(
      `#${containerId}`,
      partObj.graphical_data,
      colorData,
      guessName
    );

    // Hook up the reset button
    resetBtn.onclick = () => {
      if (typeof resetViewFill === "function") resetViewFill();
      if (typeof resetViewLine === "function") resetViewLine();
    };
  } catch (err) {
    console.error("Failed to render SVG for part", partObj, err);
  }
}

/**
 * Walk type_number space in chunks and, for each part:
 *  - create its DOM cell immediately
 *  - start an async fetch+render for that specific part
 *
 * This is where the "procedural loading" semantics live.
 */
async function loadAllPartsProcedurally(typeId, typeObj, containerEl) {
  const CHUNK_SIZE = 15;          // type_numbers per batch
  const MAX_EMPTY_CHUNKS = 10;    // stop after N empty ranges in a row
  const HARD_TYPE_NUMBER_CAP = 1000; // safety cap

  let startTypeNum = 1;
  let emptyChunks = 0;
  let totalParts = 0;

  while (startTypeNum <= HARD_TYPE_NUMBER_CAP && emptyChunks < MAX_EMPTY_CHUNKS) {
    const endTypeNum = startTypeNum + CHUNK_SIZE - 1;
    const range = [];
    for (let n = startTypeNum; n <= endTypeNum; n++) {
      range.push(n);
    }

    let parts = [];
    try {
      parts = await fetchPartsForTypeNumberIn(typeId, range);
    } catch (err) {
      console.error("Error fetching parts chunk", range, err);
      break;
    }

    if (!Array.isArray(parts) || parts.length === 0) {
      emptyChunks++;
    } else {
      emptyChunks = 0;
      for (const p of parts) {
        totalParts++;

        // 1) Create the cell synchronously
        const { containerId, resetBtn } = createTypeCell(p, typeObj, containerEl);

        // 2) Kick off a per-part async color + SVG load, do NOT await here
        //    (each item is its own promise)
        hydrateTypeCellWithColorAndSVG(p, typeObj, containerId, resetBtn);
      }
    }

    startTypeNum = endTypeNum + 1;
  }

  if (totalParts === 0) {
    const msg = document.createElement("p");
    msg.textContent = "No parts found for this type yet.";
    containerEl.appendChild(msg);
  }
}

// 5) Main entry point for the type-catalog page
async function renderTypeCatalog() {
  const typeId = getTypeIdFromURL();
  if (!typeId) {
    const titleEl = document.getElementById("type-title");
    if (titleEl) titleEl.textContent = "No type_id specified!";
    return;
  }

  const titleEl = document.getElementById("type-title");
  const infoEl = document.getElementById("type-info");
  const gridEl = document.getElementById("type-grid");

  if (!gridEl) {
    console.error("type-catalog: #type-grid container not found.");
    return;
  }

  // Clear any previous content
  gridEl.innerHTML = "";

  // Optional header info
  let typeObj = null;
  try {
    typeObj = await fetchGraphicalPartType(typeId);
    if (titleEl) titleEl.textContent = typeObj.name;
    if (infoEl) {
      const compartment = typeObj.graphical_schema_data?._compart || "???";
      infoEl.textContent = `Compartment: ${compartment}`;
    }
  } catch (err) {
    console.error("Could not fetch typeObj details:", err);
    if (titleEl) titleEl.textContent = `GraphicalPartType #${typeId}`;
    if (infoEl) infoEl.textContent = "No details found.";
  }

  // Load all parts in chunks, with per-item async rendering
  await loadAllPartsProcedurally(typeId, typeObj, gridEl);
}

// Kick-off when this script loads
renderTypeCatalog();
