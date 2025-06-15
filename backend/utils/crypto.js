import CryptoJS from "crypto-js";

export function encryptMessage(text) {
  const SHOULD_ENCRYPT = process.env.ENCRYPT_MESSAGES !== "false"; // default = true

  if (!SHOULD_ENCRYPT) return text; // 🔓 no-op in plain-text mode

  const SECRET = process.env.MESSAGE_SECRET;
  if (!SECRET) throw new Error("MESSAGE_SECRET is not set");
  return CryptoJS.AES.encrypt(text, SECRET).toString();
}

export function decryptMessage(str) {
  let output = str; // default: give back what we got
  const SHOULD_ENCRYPT = process.env.ENCRYPT_MESSAGES !== "false";

  if (SHOULD_ENCRYPT) {
    // encryption mode ON
    const SECRET = process.env.MESSAGE_SECRET;

    if (SECRET) {
      // secret is present
      if (/^U2FsdGVkX1/.test(str)) {
        // looks like CryptoJS-salted blob
        try {
          const bytes = CryptoJS.AES.decrypt(str, SECRET);
          const plain = bytes.toString(CryptoJS.enc.Utf8);

          if (plain) output = plain; // decryption succeeded → overwrite
        } catch {
          output = "[Decryption failed]"; // AES threw ⇒ flag failure
        }
      }
      // else: prefix mismatch → keep original text in `output`
    } else {
      console.error("❌ MESSAGE_SECRET is missing during decryption.");
      output = "[Decryption failed]";
    }
  }
  // else: SHOULD_ENCRYPT is false → leave `output` unchanged

  return output;
}
