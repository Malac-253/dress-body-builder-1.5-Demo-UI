// config.js - Stores global settings & test flags

const Config = {
    app: {
        totalDuration: 60, // Default timeline duration in seconds
        gridSize: 1, // Grid unit in seconds
        numTracks: 3, // Default track count
        scrubberMoveSpeed: 1, // Speed of scrubber movement in seconds per tick
        fastForwardSeconds: 10, // Fast-forward step size
        scrubberAlwaysVisible: true, // Keep scrubber inside scroll view
        enablePreviewSVG: true, // If true, show Preview SVG under timeline
    },

    testing: { //(false/true)
        UITestViewOnly: true, // If true, populates UI with mock data
        MockControllerTesting: false, // If true, loads mock controller logic
        MockModelTesting: false, // If true, loads mock model data
        FullAppMockTesting: false, // If true, simulates everything
    },

    logging: {
        level: "trace", // Options: "trace", "info", "warn", "error"
    },

    layers: {
        autoExpandSearchResults: true, // If true, expands layers that match search results
    }
};

// Automatically enable mock functions based on config - Load mock data if UI Test Mode is enabled
if (Config.testing.UITestViewOnly) {
    document.addEventListener("DOMContentLoaded", () => {
        import("../examples/view/mockPopulateTimeline.js").then(module => module.populateMockTimeline());
        import("../examples/view/mockPopulateParameters.js").then(module => module.populateMockParameters());
        import("../examples/view/mockPopulateLayers.js").then(module => module.populateMockLayers());
        import("../examples/view/mockPopulateAnimationList.js").then(module => module.populateMockAnimationList());
        
        // Enable Preview SVG if setting is enabled
        if (Config.app.enablePreviewSVG) {
            document.getElementById("previewSVGContainer").style.display = "block";
        }
    });
}

export default Config;
