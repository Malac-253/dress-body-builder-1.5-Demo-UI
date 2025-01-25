const API_BASE = "https://dress-body-builder-2.onrender.com/api/"; // Example base URL

// How many columns per row for GraphicalParts
const COLUMNS_PER_ROW = 4;

async function getGraphicalPartTypes() {
  const response = await fetch(`${API_BASE}graphical-types/`);
  if (!response.ok) {
    throw new Error("Failed to fetch GraphicalPartTypes");
  }
  return response.json();
}

async function getGraphicalPartsByType(typeId) {
  // We'll assume there's a query param like ?graphical_type_id=<id>
  const response = await fetch(`${API_BASE}graphical-parts/?graphical_type_id=${typeId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch GraphicalParts for type " + typeId);
  }
  return response.json();
}

// Placeholder function to combine part data with color design
// In real usage, you'd integrate your addLineGroup / addColorGroup logic or do a server-side merge
function mergeGraphicalAndColorData(part, colorDesign) {
  // Stub: merges `_layers.main` with color data, etc.
  // Return an object that includes final inline SVG instructions
  return {
    // minimal example
    svgPaths: part.graphical_data?.Capes?._layers?.main ?? [] // just an example
  };
}

// Render inline SVG based on d_values
function createInlineSvg(svgPaths, width=150, height=150) {
  // Create an <svg> element
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.setAttribute("viewBox", "0 0 500 500"); // example. Adjust as needed

  // For each path in svgPaths, create an <path> element
  svgPaths.forEach((pathObj, idx) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathObj._d_value);
    path.setAttribute("fill", "gray"); // default fill, can be replaced with color design logic
    svg.appendChild(path);
  });

  return svg;
}

// Creates a row for a single GraphicalPartType
function createTypeRow(type, parts) {
  // Container for this type row
  const typeRow = document.createElement("div");
  typeRow.className = "type-row";

  // Title
  const heading = document.createElement("h2");
  heading.textContent = `Type: ${type.name}`;
  typeRow.appendChild(heading);

  // Nav arrows + grid
  const navWrapper = document.createElement("div");
  navWrapper.className = "nav-arrows";

  const leftArrow = document.createElement("div");
  leftArrow.className = "arrow";
  leftArrow.innerHTML = "&lt;";
  navWrapper.appendChild(leftArrow);

  const grid = document.createElement("div");
  grid.className = "type-grid";

  // We'll keep track of pagination using an index
  let pageIndex = 0;

  function renderPage() {
    grid.innerHTML = ""; // Clear existing cells
    const start = pageIndex * COLUMNS_PER_ROW;
    const end = start + COLUMNS_PER_ROW;
    const currentParts = parts.slice(start, end);

    currentParts.forEach((part) => {
      const cell = document.createElement("div");
      cell.className = "cell";

      // 1. (Optional) Fetch color design or use standard color design
      // const colorDesignData = ... (maybe fetch from your color design endpoint if needed)
      // const merged = mergeGraphicalAndColorData(part, colorDesignData)

      // 2. For now, let's just grab the paths from the part itself
      const merged = { svgPaths: [] };
      if (part.graphical_data) {
        // Example usage: if your part is "Capes", see main layer
        merged.svgPaths = part.graphical_data?.Capes?._layers?.main ?? [];
      }

      // 3. Create inline SVG
      const svgContainer = document.createElement("div");
      svgContainer.className = "svg-container";
      const svgEl = createInlineSvg(merged.svgPaths);
      svgContainer.appendChild(svgEl);
      cell.appendChild(svgContainer);

      // 4. Text info about the part
      const info = document.createElement("p");
      info.textContent = `${part.name} (ID: ${part.graphical_part_id})`;
      cell.appendChild(info);

      grid.appendChild(cell);
    });
  }

  // Render initial page
  renderPage();

  // Left Arrow
  leftArrow.onclick = () => {
    if (pageIndex > 0) {
      pageIndex--;
      renderPage();
    }
  };

  // Right Arrow
  const rightArrow = document.createElement("div");
  rightArrow.className = "arrow";
  rightArrow.innerHTML = "&gt;";
  rightArrow.onclick = () => {
    // If there's more data to show
    if ((pageIndex + 1) * COLUMNS_PER_ROW < parts.length) {
      pageIndex++;
      renderPage();
    }
  };
  navWrapper.appendChild(grid);
  navWrapper.appendChild(rightArrow);

  typeRow.appendChild(navWrapper);
  return typeRow;
}

// Main entry point
async function renderCatalog() {
  const catalogEl = document.getElementById("catalog");

  // 1. Fetch all GraphicalPartTypes
  let types;
  try {
    types = await getGraphicalPartTypes();
  } catch (err) {
    console.error("Failed to fetch graphical part types:", err);
    return;
  }

  // 2. For each type, fetch the associated GraphicalParts
  for (const t of types) {
    let parts = [];
    try {
      const res = await fetch(`${API_BASE}graphical-parts/?graphical_type_id=${t.id}`);
      parts = await res.json();
    } catch (err) {
      console.error(`Failed to fetch parts for type ${t.name}`, err);
      continue;
    }

    // 3. Sort the parts by type_number (or whichever field you want)
    parts.sort((a, b) => a.type_number - b.type_number);

    // 4. Create the row
    const rowEl = createTypeRow(t, parts);
    catalogEl.appendChild(rowEl);
  }
}

renderCatalog();
