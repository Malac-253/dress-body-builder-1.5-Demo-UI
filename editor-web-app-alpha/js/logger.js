// logger.js

const Logger = {
    trace: (message, data) => {
      console.log(`[TRACE] ${message}`, data || "");
    },
    info: (message, data) => {
      console.log(`[INFO] ${message}`, data || "");
    },
    warn: (message, data) => {
      console.warn(`[WARN] ${message}`, data || "");
    },
    error: (message, data) => {
      console.error(`[ERROR] ${message}`, data || "");
    },
  };
  
  export default Logger;
  