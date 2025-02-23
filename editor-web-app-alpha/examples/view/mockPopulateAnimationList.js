// mockPopulateAnimationList.js
import Logger from "../../js/logger.js";

export function populateMockAnimationList() {
    Logger.trace("[MOCK] Populating Available Animations UI");

    const animationItems = document.getElementById("animationItems");
    if (!animationItems) {
        Logger.error("[MOCK] Animation list container not found!");
        return;
    }
    animationItems.innerHTML = "";

    const mockAnimations = [
        {
            id: "walk",
            name: "Walk Cycle",
            longName: "cutaway.tools.character.walk",
            parameters: ["startTime", "duration", "speed"],
        },
        {
            id: "jump",
            name: "Jump",
            longName: "cutaway.tools.character.jump",
            parameters: ["startTime", "height", "duration"],
        },
        {
            id: "fadeIn2",
            name: "Fade In2",
            longName: "cutaway.tools.effects.fadeIn",
            parameters: ["startTime", "duration", "opacityEnd"],
        },
        {
            id: "walk2",
            name: "Walk Cycle2",
            longName: "cutaway.tools.character.walk",
            parameters: ["startTime", "duration", "speed"],
        },
        {
            id: "jump2",
            name: "Jump2",
            longName: "cutaway.tools.character.jump",
            parameters: ["startTime", "height", "duration"],
        },
        {
            id: "fadeIn2",
            name: "Fade In2",
            longName: "cutaway.tools.effects.fadeIn",
            parameters: ["startTime", "duration", "opacityEnd"],
        }
    ];

    mockAnimations.forEach((anim) => {
        const animDiv = document.createElement("div");
        animDiv.classList.add("animation-item");
        animDiv.dataset.animId = anim.id;
        animDiv.textContent = anim.name;
        animDiv.draggable = true;

        // Tooltip logic
        const tooltipDiv = document.createElement("div");
        tooltipDiv.classList.add("animation-tooltip");
        tooltipDiv.innerHTML = `<strong>${anim.name}</strong><br/>${anim.parameters.join(", ")}`;
        document.body.appendChild(tooltipDiv);

        animDiv.addEventListener("mouseenter", (e) => {
            tooltipDiv.style.display = "block";
            tooltipDiv.style.position = "absolute";
            tooltipDiv.style.top = `${e.clientY + 10}px`;
            tooltipDiv.style.left = `${e.clientX + 10}px`;
        });

        animDiv.addEventListener("mouseleave", () => {
            tooltipDiv.style.display = "none";
        });

        animationItems.appendChild(animDiv);
    });

    Logger.info("[MOCK] Animation List Populated");
}
