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
        UITestViewOnly: false, // If true, populates UI with mock data
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
        
        Logger.info("⚡ UI Test Mode: Using mock views only!");

        if (Config.app.enablePreviewSVG) {
            document.getElementById("previewSVGContainer").style.display = "block";
        }
    });
}

// If Mock Controller Testing is enabled, replace controllers
if (Config.testing.MockControllerTesting) {
    import("../examples/controller/mockTimelineController.js").then(module => window.TimelineController = module.default);
    import("../examples/controller/mockAnimationController.js").then(module => window.AnimationController = module.default);
    Logger.info("⚡ Using mock controllers!");
}

// If Mock Model Testing is enabled, replace models
if (Config.testing.MockModelTesting) {
    import("../examples/model/mockTimelineModel.js").then(module => window.TimelineModel = module.default);
    import("../examples/model/mockAnimationModel.js").then(module => window.AnimationModel = module.default);
    Logger.info("⚡ Using mock models!");
}

export default Config;
