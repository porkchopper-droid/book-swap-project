/**
 * Logs debug messages only if DEBUG=true in .env
 * Example usage:
 *   import { debugLog } from "../utils/debug.js";
 *   debugLog("This is a debug log.");
 */

export const debugLog = (...args) => {
  if (process.env.DEBUG === "true") {
    console.log(...args);
  }
};
