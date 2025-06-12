export const debugLog = (...args) => {
  if (import.meta.env.VITE_DEBUG === "true") {
    console.log(...args);
  }
};