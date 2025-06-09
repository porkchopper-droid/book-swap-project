import fs from "fs";
import crypto from "crypto";
import path from "path";

const baseDir = process.cwd(); // Wherever you run the script from
const outputFile = path.join(baseDir, "code-integrity.json");

const walkDir = (dir, fileList = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      // Skip node_modules and testing-trash
      if (!/node_modules|testing-trash/.test(fullPath)) {
        walkDir(fullPath, fileList);
      }
    } else {
      // Save relative path
      const relativePath = path.relative(baseDir, fullPath);
      fileList.push(relativePath);
    }
  }
  return fileList;
};

const allFiles = walkDir(baseDir);
const integrityData = allFiles.map((relativePath) => {
  const fileBuffer = fs.readFileSync(path.join(baseDir, relativePath));
  const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
  return { File: relativePath, Hash: hash };
});

fs.writeFileSync(outputFile, JSON.stringify(integrityData, null, 2));
console.log("✅ Integrity snapshot updated!");
