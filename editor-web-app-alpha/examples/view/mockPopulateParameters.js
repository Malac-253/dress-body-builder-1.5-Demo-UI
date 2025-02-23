// mockPopulateParameters.js - Populates the Parameters UI with mock values for SVG Add Animation
import Logger from "../../js/logger.js";

export function populateMockParameters() {
    Logger.trace("[MOCK] Populating Parameters UI for 'SVG Add' Animation");

    const paramForm = document.getElementById("paramForm");
    if (!paramForm) {
        Logger.error("[MOCK] Parameters container not found!");
        return;
    }

    paramForm.innerHTML = "";

    // Generate Unique ID for the animation instance
    const animationType = "cutaway.tools.svg.add";
    const timelineID = `svgAdd_${Date.now()}`;
    const animationName = `${animationType}_${timelineID}`;

    const mockParams = [
        // Group 1: Basic info
        { label: "Animation Name", type: "text", value: animationName, note: "Can be edited" },
        { label: "Timeline ID", type: "staticText", value: timelineID },

        // Group 2: File & IDs
        { label: "File", type: "text", value: "myFile.svg", note: "Path or name of the SVG file", isMandatory: true },
        { label: "SVG Preview ID", type: "text", value: "myFile_svg123", note: "ID used inside the SVG preview" },
        { label: "Before ID", type: "text", value: "", note: "Optional: Reference layer ID to insert before" },

        // Group 3: Transformations
        { label: "Scale X", type: "number", value: 1, step: 0.1 },
        { label: "Scale Y", type: "number", value: 1, step: 0.1 },
        { label: "Flip Horizontally", type: "checkbox", value: false },
        { label: "Flip Vertically", type: "checkbox", value: false },
        { label: "Translation X", type: "number", value: 0 },
        { label: "Translation Y", type: "number", value: 0 },
        { label: "Rotation (degrees)", type: "number", value: 0, step: 1 },

        // Group 4: Timeline
        { label: "Start Time (s)", type: "number", value: 0, note: "Required", isMandatory: true },
        { label: "End Time (s)", type: "number", value: 2, note: "Required", isMandatory: true },
        { label: "Duration (s)", type: "number", value: 2, note: "Auto-calculated if empty" },
    ];

    mockParams.forEach((param) => {
        const fieldWrapper = document.createElement("div");
        fieldWrapper.classList.add("param-field");

        // Label for parameter
        const labelEl = document.createElement("label");
        labelEl.textContent = param.label;
        fieldWrapper.appendChild(labelEl);

        // Mandatory Field Indicator
        if (param.isMandatory) {
            const mandatoryIndicator = document.createElement("span");
            mandatoryIndicator.classList.add("mandatory-indicator");
            mandatoryIndicator.textContent = "▲";  // Triangle icon
            mandatoryIndicator.style.color = "#8B0000";  // Burgundy Red
            labelEl.appendChild(mandatoryIndicator);
        }

        // Input Element
        let inputEl;
        if (param.type === "staticText") {
            inputEl = document.createElement("div");
            inputEl.classList.add("static-text");
            inputEl.textContent = param.value;
        } else {
            inputEl = document.createElement("input");
            inputEl.type = param.type;
            if (param.step) inputEl.step = param.step;
            if (param.type === "checkbox") {
                inputEl.checked = Boolean(param.value);
            } else {
                inputEl.value = param.value;
            }
        }

        inputEl.dataset.paramKey = param.label;  // Store key for logging
        fieldWrapper.appendChild(inputEl);

        // Tooltip for Parameter Notes
        if (param.note) {
            const tooltipIcon = document.createElement("span");
            tooltipIcon.classList.add("tooltip-icon-param");
            tooltipIcon.textContent = "ℹ";
            tooltipIcon.title = param.note;
            fieldWrapper.appendChild(tooltipIcon);
        }

        paramForm.appendChild(fieldWrapper);
    });

    // Apply Parameters Button
    const submitBtn = document.createElement("button");
    submitBtn.textContent = "Apply Parameters";
    submitBtn.id = "applyParamsBtn";

    submitBtn.addEventListener("click", () => {
        const updatedParams = {};
        document.querySelectorAll(".param-field input").forEach((input) => {
            const key = input.dataset.paramKey;
            if (input.type === "checkbox") {
                updatedParams[key] = input.checked;
            } else {
                updatedParams[key] = input.value;
            }
        });

        Logger.info("[MOCK] Applied Parameters", updatedParams);
        console.log("Applied Parameters:", updatedParams);
    });

    paramForm.appendChild(submitBtn);

    Logger.info("[MOCK] Parameters UI Populated for SVG Add", { timelineID });
}
