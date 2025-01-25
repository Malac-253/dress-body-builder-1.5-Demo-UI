/*****************************************
 * grand-catalog.js
 *****************************************/

const API_BASE = "https://dress-body-builder-2.onrender.com/api/";
const GUEST_USER_TOKEN = "e41cac5b45048591b81cf84a7070e78765a58be6";
const ACCESS_CODE = "6tosDJj29gvSJ7xdu3LsO0LoVgZOoeB8";
const ANIM_STYLE_ID = 3;

const ROWS_PER_FETCH = 5;

const TYPE_ORDER = {
  eyes: 12,
  mouth: 2,
  eyebrows: 3,
  hair: 4,
  shirt: 5,
  sleeves: 6,
  pants: 7,
  shoes: 8,
};

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
  h3.textContent = typeObj.name;
  rowHeader.appendChild(h3);

  // Additional info block
  const infoDiv = document.createElement("div");
  infoDiv.className = "row-info";
  const desc = typeObj.description || "None";
  const compartment = typeObj.graphical_schema_data?._compart ?? "unknown";
  const owner = typeObj.owned_by ?? "???";
  const typeId = typeObj.graphical_type_id;

  infoDiv.innerHTML = `
    <p>Description: ${desc}</p>
    <p>Compartment: ${compartment}</p>
    <p style="font-size:12px;">Owned by: ${owner} – ID: ${typeId}</p>
  `;
  rowHeader.appendChild(infoDiv);

  // Arrows
  const rowArrows = document.createElement("div");
  rowArrows.className = "row-arrows";

  const leftArrow = document.createElement("div");
  leftArrow.className = "arrow arrow-left";
  leftArrow.innerHTML = "&lt;";
  leftArrow.onclick = () => alert(`Left arrow for ${typeObj.name}`);
  rowArrows.appendChild(leftArrow);

  const rightArrow = document.createElement("div");
  rightArrow.className = "arrow arrow-right";
  rightArrow.innerHTML = "&gt;";
  rightArrow.onclick = () => alert(`Right arrow for ${typeObj.name}`);
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
  pName.textContent = partObj.name;
  cell.appendChild(pName);

  const colorCarousel = document.createElement("div");
  colorCarousel.className = "color-carousel";

  const left = document.createElement("div");
  left.className = "color-arrow color-arrow-left";
  left.innerHTML = "&#9664;";
  left.onclick = () => alert(`Left color for ${partObj.name}`);

  const label = document.createElement("div");
  label.className = "color-states";
  label.textContent = "1 / ??";

  const right = document.createElement("div");
  right.className = "color-arrow color-arrow-right";
  right.innerHTML = "&#9654;";
  right.onclick = () => alert(`Right color for ${partObj.name}`);

  colorCarousel.appendChild(left);
  colorCarousel.appendChild(label);
  colorCarousel.appendChild(right);

  cell.appendChild(colorCarousel);

  return { cell, containerId };
}

// Main Render
async function renderGrandCatalog() {
  const container = document.getElementById("catalog-container");
  container.innerHTML = "";

  let types;
  try {
    types = await fetchGraphicalPartTypes();
    console.log("GraphicalPartTypes returned:", types);
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
    const { rowSection, grid } = createTypeRowDOM(t);
    container.appendChild(rowSection);
    try {
      const parts = await tryFindParts(t.graphical_type_id);
      if (parts.length === 0) {
        console.log(`No parts found for type ${t.name}`);
        continue;
      }
      console.log(`Parts for ${t.name} (#${t.graphical_type_id}):`, parts);

      for (const p of parts) {
        const { cell, containerId } = createPartCell(p);
        // 1) Append the cell so D3 can find the container
        grid.appendChild(cell);

        // 2) Fetch color design
        let cDesigns = [];
        try {
          cDesigns = await fetchColorDesigns(p.graphical_part_id);
        } catch(e) {
          console.warn("No color designs for part", p.name);
        }

        let usedDesign = null;
        if (p.standard_color_design) {
          usedDesign = cDesigns.find(cd => cd.color_design_id === p.standard_color_design);
        }
        if (!usedDesign && cDesigns.length > 0) {
          usedDesign = cDesigns[0];
        }
        const colorData = usedDesign ? usedDesign.color_data : { _line_group:[], _color_group:[] };

        // 3) Actually render the SVG
        if (p.graphical_data) {
          console.log(`renderGraphicalPartSVG => type "${t.name}" / container "#${containerId}" / part name ${p.name}`);
          await renderGraphicalPartSVG(`#${containerId}`, p.graphical_data, colorData, t.name);
        }
      }
    } catch (err) {
      console.error(`Failed to fetch parts for type ${t.name}:`, err);
    }

    
  }
}

renderGrandCatalog();
