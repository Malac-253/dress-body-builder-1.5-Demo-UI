// logger.js - Improved instance-based logging
import Config from "../config/config.js";

class LoggerInstance {
    constructor(filePrefix) {
        this._filePrefix = `[${filePrefix}] `;
        this._functionPrefix = ""; // Function-specific prefix (temporary scope)
    }

    // Set a function prefix (temporary, scoped inside functions)
    setFunctionPrefix(prefix) {
        this._functionPrefix = `[${prefix}] `;
    }

    // Reset function prefix after use
    clearFunctionPrefix() {
        this._functionPrefix = "";
    }

    // Internal function to check log level
    _shouldLog(level) {
        const levels = ["trace", "info", "warn", "error"];
        return levels.indexOf(level) >= levels.indexOf(Config.logging.level);
    }

    trace(message, data) {
        if (this._shouldLog("trace")) {
            console.log(`[TRACE] ${this._filePrefix}${this._functionPrefix}${message}`, data || "");
        }
    }

    info(message, data) {
        if (this._shouldLog("info")) {
            console.log(`[INFO ] ${this._filePrefix}${this._functionPrefix}${message}`, data || "");
        }
    }

    warn(message, data) {
        if (this._shouldLog("warn")) {
            console.warn(`[WARN ] ${this._filePrefix}${this._functionPrefix}${message}`, data || "");
        }
    }

    error(message, data) {
        if (this._shouldLog("error")) {
            console.error(`[ERROR] ${this._filePrefix}${this._functionPrefix}${message}`, data || "");
        }
    }
}

// Factory function to create loggers per file
const Logger = {
    createLogger: (filePrefix) => new LoggerInstance(filePrefix),
};

export default Logger;
