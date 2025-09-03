// Test the generateHex function
function generateHex(length) {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

console.log("Testing generateHex function:");
console.log("64 chars:", generateHex(64));
console.log("128 chars:", generateHex(128));

// Test what the old method would produce
console.log("\nOld method (broken):");
for (let i = 0; i < 5; i++) {
  const old = Math.random().toString(16).substr(2, 64);
  console.log(`Length ${old.length}: ${old}`);
}

// Test what the new method produces
console.log("\nNew method (fixed):");
for (let i = 0; i < 5; i++) {
  const fixed = generateHex(64);
  console.log(`Length ${fixed.length}: ${fixed}`);
}
