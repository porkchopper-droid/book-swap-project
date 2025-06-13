import CryptoJS from "crypto-js";

export function encryptMessage(text) {

  const SHOULD_ENCRYPT = process.env.ENCRYPT_MESSAGES !== "false"; // default = true
 
  if (!SHOULD_ENCRYPT) return text; // 🔓 no-op in plain-text mode

  const SECRET = process.env.MESSAGE_SECRET;
  if (!SECRET) throw new Error("MESSAGE_SECRET is not set");
  return CryptoJS.AES.encrypt(text, SECRET).toString();
}

export function decryptMessage(ciphertext) {

  const SHOULD_ENCRYPT = process.env.ENCRYPT_MESSAGES !== "false"; // default = true
  
  if (!SHOULD_ENCRYPT) return ciphertext; // 🔓 no-op in plain-text mode
  const SECRET = process.env.MESSAGE_SECRET;
  if (!SECRET) {
    console.error("❌ MESSAGE_SECRET is missing during decryption.");
    return "[Decryption failed]";
  }
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return "[Decryption failed]";
  }
}
