import bcrypt from "bcrypt";

const runDemo = async () => {
  const plainPassword = "thereisnospoon";

  // 1. Generate salt
  const salt = await bcrypt.genSalt(10);
  console.log("Salt:", salt);

  // 2. Hash password
  const hashedPassword = await bcrypt.hash(plainPassword, salt);
  console.log("Hashed:", hashedPassword);

  // 3. Compare (correct password)
  const match = await bcrypt.compare("thereisnospoon", hashedPassword);
  console.log("Correct password match:", match); // true

  // 4. Compare (wrong password)
  const failMatch = await bcrypt.compare("fakepassword", hashedPassword);
  console.log("Wrong password match:", failMatch); // false

  // 5. TEST MYSELF:

  const plainPassAndPlainSalt = await bcrypt.hash(
    "thereisnospoon",
    "$2b$10$U90N6NcvKZAjJL7rcnsgvu"
  );
  console.log(plainPassAndPlainSalt)
};

runDemo();
