//mockPopulateAnimationList.js
import Logger from "../../js/logger.js";
const log = Logger.createLogger("mockPopulateAnimationList");

export function populateMockAnimationList() {
    
    log.trace("[MOCK] Populating Available Animations UI");

    const animationItems = document.getElementById("animationItems");
    const searchInput = document.getElementById("animationSearch"); // Reference search input

    if (!animationItems || !searchInput) {
        log.error("[MOCK] Animation list container or search input not found!");
        return;
    }

    animationItems.innerHTML = "";

    const mockAnimations = [
        { id: "walk", name: "Walk Cycle", longName: "cutaway.tools.character.walk", parameters: ["startTime", "duration", "speed"] },
        { id: "jump", name: "Jump", longName: "cutaway.tools.character.jump", parameters: ["startTime", "height", "duration"] },
        { id: "fadeIn", name: "Fade In", longName: "cutaway.tools.effects.fadeIn", parameters: ["startTime", "duration", "opacityEnd"] },
        { id: "walk2", name: "Walk Cycle 2", longName: "cutaway.tools.character.walk", parameters: ["startTime", "duration", "speed"] },
        { id: "jump2", name: "Jump 2", longName: "cutaway.tools.character.jump", parameters: ["startTime", "height", "duration"] },
        { id: "fadeIn2", name: "Fade In 2", longName: "cutaway.tools.effects.fadeIn", parameters: ["startTime", "duration", "opacityEnd"] }
    ];

    function renderAnimations(filteredAnimations) {
        animationItems.innerHTML = ""; // Clear list before re-rendering

        filteredAnimations.forEach((anim) => {
            const animDiv = document.createElement("div");
            animDiv.classList.add("animation-item");
            animDiv.dataset.animId = anim.id;
            animDiv.textContent = anim.name;
            animDiv.draggable = true;

            // Tooltip logic
            animDiv.title = `${anim.name} - Params: ${anim.parameters.join(", ")}`;

            animationItems.appendChild(animDiv);
        });
    }

    renderAnimations(mockAnimations); // Initial render

    // Search functionality
    searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase();
        const filteredAnimations = mockAnimations.filter(anim => anim.name.toLowerCase().includes(query));
        renderAnimations(filteredAnimations);
    });

    log.info("[MOCK] Animation List Populated");
}
