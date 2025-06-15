//mockPopulateLayers.js
import Logger from "../../js/logger.js";
const log = Logger.createLogger("mockPopulateLayers");

export function populateMockLayers() {
    log.trace("[MOCK] Populating Layer Tree UI");

    const layersTree = document.getElementById("layersTree");
    const previewSVGContainer = document.getElementById("previewSVGContainer");

    if (!layersTree || !previewSVGContainer) {
        log.error("[MOCK] Layers container or preview SVG container not found!");
        return;
    }

    layersTree.innerHTML = ""; // Clear existing layers
    previewSVGContainer.innerHTML = ""; // Clear existing SVG

    // Create a container for search bar and collapse button under "LAYERS"
    const layersHeader = document.createElement("div");
    layersHeader.classList.add("layers-header");

    // Create search bar for layers
    const layersSearch = document.createElement("input");
    layersSearch.type = "text";
    layersSearch.placeholder = "Search Layers...";
    layersSearch.classList.add("layers-search-bar");

    // Create collapse button
    const collapseButton = document.createElement("button");
    collapseButton.textContent = "Collapse All";
    collapseButton.classList.add("collapse-button");

    // Append elements under the "LAYERS" title
    layersHeader.appendChild(layersSearch);
    layersHeader.appendChild(collapseButton);
    layersTree.parentElement.prepend(layersHeader);

    // Create SVG dynamically
    const svgNS = "http://www.w3.org/2000/svg";
    const previewSVG = document.createElementNS(svgNS, "svg");
    previewSVG.setAttribute("width", "250");
    previewSVG.setAttribute("height", "250");
    previewSVG.setAttribute("id", "previewSVG");
    previewSVG.style.backgroundColor = "#fafafa";
    previewSVG.style.border = "1px solid #ccc";
    previewSVGContainer.appendChild(previewSVG);

    // Mock SVG Structure (Updated for better nesting)
    const svgLayers = [
        {
            id: "group1",
            type: "Group",
            hasChildren: true,
            children: [
                { id: "rect1", type: "Rectangle" },
                { id: "circle1", type: "Circle" },
            ]
        },
        {
            id: "group2",
            type: "Group",
            hasChildren: true,
            children: [
                { id: "path1", type: "Path" },
                {
                    id: "group3",
                    type: "Group",
                    hasChildren: true,
                    children: [
                        { id: "rect2", type: "Rectangle" },
                        { id: "circle2", type: "Circle" }
                    ]
                }
            ]
        }
    ];

    function createLayerUI(layer, parentElement) {
        const layerWrapper = document.createElement("div");
        layerWrapper.classList.add("layer-wrapper");

        const layerDiv = document.createElement("div");
        layerDiv.classList.add("layer-item");
        layerDiv.dataset.layerId = layer.id;
        layerDiv.textContent = `[${layer.type}] ${layer.id}`;

        if (layer.hasChildren) {
            const arrowIcon = document.createElement("span");
            arrowIcon.classList.add("arrow-icon", "collapsed");
            layerDiv.prepend(arrowIcon);

            const childrenContainer = document.createElement("div");
            childrenContainer.classList.add("layer-children");
            childrenContainer.style.display = "none";

            arrowIcon.addEventListener("click", () => {
                const isCollapsed = childrenContainer.style.display === "none";
                childrenContainer.style.display = isCollapsed ? "block" : "none";
                arrowIcon.classList.toggle("collapsed", !isCollapsed);
            });

            layer.children.forEach(child => createLayerUI(child, childrenContainer));
            layerWrapper.appendChild(childrenContainer);
        }

        layerWrapper.prepend(layerDiv);
        parentElement.appendChild(layerWrapper);
    }

    svgLayers.forEach(layer => createLayerUI(layer, layersTree));

    // Add actual SVG elements to the preview
    function createSVGElement(layer, parentSVG) {
        let element;
        switch (layer.type) {
            case "Rectangle":
                element = document.createElementNS(svgNS, "rect");
                element.setAttribute("width", "50");
                element.setAttribute("height", "50");
                element.setAttribute("x", Math.random() * 200);
                element.setAttribute("y", Math.random() * 200);
                element.setAttribute("fill", "#ffb3ba");
                break;

            case "Circle":
                element = document.createElementNS(svgNS, "circle");
                element.setAttribute("r", "25");
                element.setAttribute("cx", Math.random() * 250);
                element.setAttribute("cy", Math.random() * 200);
                element.setAttribute("fill", "#bae1ff");
                break;

            case "Path":
                element = document.createElementNS(svgNS, "path");
                element.setAttribute("d", "M10 80 C40 10, 65 10, 95 80 S150 150, 180 80");
                element.setAttribute("stroke", "black");
                element.setAttribute("fill", "transparent");
                break;

            case "Group":
                element = document.createElementNS(svgNS, "g");
                layer.children.forEach(child => createSVGElement(child, element));
                break;
        }

        if (element) {
            element.setAttribute("id", layer.id);
            parentSVG.appendChild(element);
        }
    }

    svgLayers.forEach(layer => createSVGElement(layer, previewSVG));

    // Search functionality
    layersSearch.addEventListener("input", () => {
        const query = layersSearch.value.toLowerCase();
        document.querySelectorAll(".layer-item").forEach(item => {
            const isMatch = item.dataset.layerId.toLowerCase().includes(query);
            item.style.display = isMatch ? "block" : "none";

            if (isMatch) {
                let parent = item.closest(".layer-children");
                while (parent) {
                    parent.style.display = "block";
                    parent = parent.parentElement.closest(".layer-children");
                }
            }
        });
    });

    // Collapse / Expand All Functionality
    collapseButton.addEventListener("click", () => {
        const collapsed = collapseButton.textContent === "Collapse All";
        document.querySelectorAll(".layer-children").forEach(child => {
            child.style.display = collapsed ? "none" : "block";
        });
        document.querySelectorAll(".arrow-icon").forEach(arrow => {
            arrow.classList.toggle("collapsed", collapsed);
        });
        collapseButton.textContent = collapsed ? "Expand All" : "Collapse All";
    });

    log.info("[MOCK] Layer Tree and Preview SVG Populated");
}
