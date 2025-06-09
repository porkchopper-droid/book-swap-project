import fs from "fs";
import crypto from "crypto";
import path from "path";

const baseDir = process.cwd();
const integrityFile = path.join(baseDir, "code-integrity.json");
const integrityData = JSON.parse(fs.readFileSync(integrityFile, "utf-8"));

const calculateChecksum = (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
};

let integrityCompromised = false;

const skipFiles = [".env", "logs\\cron.log"];

for (const { File, Hash } of integrityData) {
  if (skipFiles.includes(File)) continue;

  const absolutePath = path.join(baseDir, File);
  try {
    const currentHash = calculateChecksum(absolutePath);
    if (currentHash !== Hash) {
      console.log(`⚠️ Code integrity issue: ${File} has been modified!`);
      integrityCompromised = true;
    }
  } catch (err) {
    console.log(`⚠️ Could not read ${File}: ${err.message}`);
    integrityCompromised = true;
  }
}

if (!integrityCompromised) {
  console.log("✅ All files are intact.");
} else {
  console.log("⚠️ WARNING: Code integrity compromised!");
}
