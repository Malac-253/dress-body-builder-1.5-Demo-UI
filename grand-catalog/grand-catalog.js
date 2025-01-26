/*****************************************
 * grand-catalog.js
 *****************************************/

async function fetchGraphicalPartTypes() {
  const url = `${API_BASE}graphical-part-type/?anim_style_id=${ANIM_STYLE_ID}&access_code=${ACCESS_CODE}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Token ${GUEST_USER_TOKEN}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch GraphicalPartTypes");
  return res.json();
}

async function fetchGraphicalParts(typeId, startId, endId) {
  const inList = [];
  for (let i = startId; i <= endId; i++) {
    inList.push(i);
  }
  const inParam = inList.join(",");
  const url = `${API_BASE}graphical-parts/?graphical_type_id=${typeId}&type_number__in=${inParam}&access_code=${ACCESS_CODE}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Token ${GUEST_USER_TOKEN}`
    }
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch GraphicalParts for typeId=${typeId}, in=[${inParam}]`);
  }
  return res.json();
}

async function tryFindParts(typeId) {
  for (let offset = 1; offset < 50; offset++) {
    const parts = await fetchGraphicalParts(typeId, offset, offset + 4);
    if (parts.length > 0) return parts;
  }
  return [];
}

async function fetchColorDesigns(partId) {
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



// DOM Builders
function createTypeRowDOM(typeObj) {
  const rowSection = document.createElement("section");
  rowSection.className = "catalog-row";

  const rowHeader = document.createElement("div");
  rowHeader.className = "row-header";

  const h3 = document.createElement("h3");
  //   h3.textContent = typeObj.name;
  //   rowHeader.appendChild(h3);

  const typeLink = document.createElement("a");
  typeLink.href = `../type-catalog/type-catalog.html?type_id=${typeObj.graphical_type_id}`;
  typeLink.target = TARGET;
  typeLink.textContent = typeObj.name; 
  h3.appendChild(typeLink);
  rowHeader.appendChild(h3);


  // Additional info block
  const infoDiv = document.createElement("div");
  infoDiv.className = "row-info";
  const desc = typeObj.description || "None";
  const compartment = typeObj.graphical_schema_data?._compart ?? "unknown";
  const owner = typeObj.owned_by ?? "???";
  const typeId = typeObj.graphical_type_id;

  infoDiv.innerHTML = `
    <p>Compartment Type: '${compartment}'</p>
    <p>Description: ${desc}</p>
    <p style="font-size:12px;">Owned by: B3 Lite & Amote Studio – ID: ${typeId}</p>
  `;
  rowHeader.appendChild(infoDiv);

  // Arrows
  const rowArrows = document.createElement("div");
  rowArrows.className = "row-arrows";

  const leftArrow = document.createElement("div");
  leftArrow.className = "arrow arrow-left";
  leftArrow.innerHTML = "&lt;";
  leftArrow.onclick = () => alert(`(PlaceHolder CODE) Left arrow for ${typeObj.name}`);
  rowArrows.appendChild(leftArrow);

  const rightArrow = document.createElement("div");
  rightArrow.className = "arrow arrow-right";
  rightArrow.innerHTML = "&gt;";
  rightArrow.onclick = () => alert(`(PlaceHolder CODE) Right arrow for ${typeObj.name}`);
  rowArrows.appendChild(rightArrow);

  rowHeader.appendChild(rowArrows);

  rowSection.appendChild(rowHeader);

  const grid = document.createElement("div");
  grid.className = "catalog-grid";
  rowSection.appendChild(grid);

  return { rowSection, grid };
}

function createPartCell(partObj) {
  const cell = document.createElement("div");
  cell.className = "catalog-cell";

  const svgContainer = document.createElement("div");
  svgContainer.className = "svg-container";
  const containerId = `svgContainer-${partObj.graphical_part_id}`;
  svgContainer.id = containerId;
  cell.appendChild(svgContainer);

  const pName = document.createElement("p");
  pName.className = "part-name";

//   pName.textContent = partObj.name;
//   cell.appendChild(pName);

    const link = document.createElement("a");
  // Link to new page "single-part.html?part_id=###"
  link.href = `../single-part/single-part.html?part_id=${partObj.graphical_part_id}`;
  link.target = TARGET;; // open in new tab
  link.textContent = partObj.name;
  pName.appendChild(link);
  cell.appendChild(pName);

  // Add "author" under the name if you want it in the main page too:
  const authorLine = document.createElement("p");
  authorLine.className = "author-line";
  // authorLine.textContent = `Author: ${partObj.owned_by ?? "???"}`;
  authorLine.textContent = `Author: B3 Lite & Amote Studio`;
  cell.appendChild(authorLine);

  const colorCarousel = document.createElement("div");
  colorCarousel.className = "color-carousel";

  const left = document.createElement("div");
  left.className = "color-arrow color-arrow-left";
  left.innerHTML = "&#9664;";
  left.onclick = () => alert(`(PlaceHolder CODE) Left color for ${partObj.name}`);

  const label = document.createElement("div");
  label.className = "color-states";
  label.textContent = "1 / ??";

  const right = document.createElement("div");
  right.className = "color-arrow color-arrow-right";
  right.innerHTML = "&#9654;";
  right.onclick = () => alert(`(PlaceHolder CODE) Right color for ${partObj.name}`);

  colorCarousel.appendChild(left);
  colorCarousel.appendChild(label);
  colorCarousel.appendChild(right);

  cell.appendChild(colorCarousel);
  
    // Create a reset button
    const resetBtn = document.createElement("button");
    resetBtn.className = "reset-view-btn";
    resetBtn.textContent = "Reset View";
    cell.appendChild(resetBtn);

  return { cell, containerId, resetBtn };
}

// Main Render
async function renderGrandCatalog() {
  const container = document.getElementById("catalog-container");
  container.innerHTML = "";

  let types;
  try {
    types = await fetchGraphicalPartTypes();
    //console.log("GraphicalPartTypes returned:", types);
  } catch (err) {
    console.error("Failed to fetch GraphicalPartTypes:", err);
    return;
  }

  // Sort them
  types.sort((a, b) => {
    const aVal = TYPE_ORDER[a.name.toLowerCase()] || 999;
    const bVal = TYPE_ORDER[b.name.toLowerCase()] || 999;
    return aVal - bVal;
  });

  // For each type, create row
  for (const t of types) {

    if (SKIP_TYPES.includes(t.name.toLowerCase())) {
        //console.log(`Skipping type: ${t.name}`);
        continue;
      }

    const { rowSection, grid } = createTypeRowDOM(t);
    container.appendChild(rowSection);
    try {
      const parts = await tryFindParts(t.graphical_type_id);
      if (parts.length === 0) {
        console.error(`No parts found for type ${t.name}`);
        continue;
      }
 
        // ... after you fetch a list/array "parts"
        const partIds = parts.map(p => p.graphical_part_id);
        const colorDesignMap = await fetchColorDesignsBulk(partIds);

      for (const p of parts) {
        const { cell, containerId, resetBtn } = createPartCell(p);
        // 1) Append the cell so D3 can find the container
        grid.appendChild(cell);

        // 2) Fetch color design
        // let cDesigns = [];
        // try {
        //   cDesigns = await fetchColorDesigns(p.graphical_part_id);
        // } catch(e) {
        //   console.error("No color designs for part", p.name);
        // }
        const cDesigns = colorDesignMap[p.graphical_part_id] || [];

        let usedDesign = null;
        if (p.standard_color_design) {
          usedDesign = cDesigns.find(cd => cd.color_design_id === p.standard_color_design);
        }
        if (!usedDesign && cDesigns.length > 0) {
          usedDesign = cDesigns[0];
        }
        const colorData = usedDesign ? usedDesign.color_data : { _line_group:[], _color_group:[] };

        // 3) Actually render the SVG
        
        const { resetViewFill, resetViewLine } = await renderGraphicalPartSVG(`#${containerId}`, p.graphical_data, colorData, t.name);
        

        resetBtn.onclick = () => {
            if (resetViewFill) resetViewFill();
            if (resetViewLine) resetViewLine();
        };
      }
    } catch (err) {
      console.error(`Failed to  for type ${t.name}:`, err);
    }

    
  }
}

renderGrandCatalog();
