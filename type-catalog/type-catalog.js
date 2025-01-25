/********************************************
 * type-catalog.js
 *
 * - read type_id from URL
 * - fetch the type (optional) to get name/desc
 * - fetch up to 20 parts
 * - display them in a grid
 ********************************************/

// 1) parse type_id
function getTypeIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("type_id");
}

// 2) fetch a single GraphicalPartType (optional) if you want the name/desc
async function fetchGraphicalPartType(typeId) {
  const url = `${API_BASE}graphical-part-type/${typeId}/?access_code=${ACCESS_CODE}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Token ${GUEST_USER_TOKEN}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch GraphicalPartType " + typeId);
  return res.json();
}

// 3) fetch up to 20 parts for that type
async function fetchPartsForTypeNumberIn(typeId, inArray) {
  // Build a comma-separated string, e.g. "1,2,3,4,5"
  const inParam = inArray.join(',');
  // e.g. ?graphical_type_id=10&type_number__in=1,2,3,4,5
  const url = `${API_BASE}graphical-parts/?graphical_type_id=${typeId}&type_number__in=${inParam}&access_code=${ACCESS_CODE}`;
  console.log("Fetching parts from:", url);

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Token ${GUEST_USER_TOKEN}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch GraphicalParts with type_number__in=[${inParam}] for typeId=${typeId}`);
  }
  return res.json(); // Should be an array of parts
}

// 4) main render
// Our main function for the type-catalog page
async function renderTypeCatalog() {
  const typeId = getTypeIdFromURL(); // e.g. ?type_id=10
  if (!typeId) {
    document.getElementById("type-title").textContent = "No type_id specified!";
    return;
  }

  // Optional: fetch the GraphicalPartType object
  let typeObj = null;
  try {
    typeObj = await fetchGraphicalPartType(typeId); // e.g. GET /graphical-part-type/10
    document.getElementById("type-title").textContent = typeObj.name;
    document.getElementById("type-info").textContent = `Compartment: ${typeObj.graphical_schema_data?._compart || "???"}`;
  } catch (err) {
    console.warn("Could not fetch typeObj details:", err);
    document.getElementById("type-title").textContent = `GraphicalPartType #${typeId}`;
    document.getElementById("type-info").textContent = "No details found.";
  }

  // We'll create a row-like structure. If you want just a grid, you can skip row creation
  // But let's do something similar to your snippet
  const container = document.getElementById("type-grid");

  // 1) array of type numbers you want
  const range1To5 = [1,2,3,4,5,6,7,8,9,10];
  // or maybe [6,7,8,9,10], etc. 
  // or you can build multiple arrays in a loop

  // We'll do a single pass: [1..5]
  try {
    const parts = await fetchPartsForTypeNumberIn(typeId, range1To5);
    if (parts.length === 0) {
      console.log(`No parts found for type #${typeId} in numbers [${range1To5}]`);
      return;
    }
    console.log(`Parts for typeId=${typeId}, type_number in [${range1To5}]:`, parts);

    for (const p of parts) {
      // Create the cell
      const cell = document.createElement("div");
      cell.className = "type-cell";

      // (A) The <div class="svg-container">
      const svgContainer = document.createElement("div");
      svgContainer.className = "svg-container";
      const containerId = `svgContainer-${p.graphical_part_id}`;
      svgContainer.id = containerId;
      cell.appendChild(svgContainer);

      // (B) Part name + link to single-part page
      const pName = document.createElement("p");
      pName.className = "part-name";
      const anchor = document.createElement("a");
      anchor.href = `../single-part/single-part.html?part_id=${p.graphical_part_id}`;
      anchor.target = TARGET;
      anchor.textContent = p.name;
      pName.appendChild(anchor);
      cell.appendChild(pName);

      // (C) Author line
      const authorLine = document.createElement("p");
      authorLine.className = "author-line";
      authorLine.textContent = `Author: ${p.owned_by ?? "???"}`;
      cell.appendChild(authorLine);

      // (D) Reset View button
      const resetBtn = document.createElement("button");
      resetBtn.className = "reset-btn";
      resetBtn.textContent = "Reset View";
      cell.appendChild(resetBtn);

      // Finally, append the cell to the container
      container.appendChild(cell);

      // Now fetch color designs for this part
      let cDesigns = [];
      try {
        cDesigns = await fetchColorDesignsForPart(p.graphical_part_id);
      } catch(e) {
        console.warn("No color designs for part", p.name, e);
      }
      let usedDesign = null;
      if (p.standard_color_design) {
        usedDesign = cDesigns.find(cd => cd.color_design_id === p.standard_color_design);
      }
      if (!usedDesign && cDesigns.length > 0) {
        usedDesign = cDesigns[0];
      }
      const colorData = usedDesign ? usedDesign.color_data : { _line_group:[], _color_group:[] };

      // Render the <svg> 
      // We'll pass typeObj?.name or fallback
      if (p.graphical_data) {
        console.log(`Render part ${p.name}, container "#${containerId}"`);
        const guessName = typeObj?.name || "unknown";
        const { resetView } = renderGraphicalPartSVG(`#${containerId}`, p.graphical_data, colorData, guessName.toLowerCase());
        // Attach reset
        resetBtn.onclick = () => resetView();
      }

      
    }
  } catch (err) {
    console.error(`Failed to fetch or render parts for type #${typeId}`, err);
  }
}

// 5) fetch color designs
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

// Start
renderTypeCatalog();
