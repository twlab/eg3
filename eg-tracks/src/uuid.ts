/* On its own rather than in util.ts, which loads every built-in genome:
   the track drawing code needs ids without that. */

// Cross-platform UUID generator for browsers and Node.js

export function generateUUID() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  // Fallback for browsers/environments without crypto.randomUUID
  // RFC4122 version 4 compliant
  let uuid = "";
  let random;
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    random = () => crypto.getRandomValues(new Uint8Array(1))[0];
  } else {
    random = () => Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < 16; i++) {
    uuid += random().toString(16).padStart(2, "0");
  }
  return (
    uuid.slice(0, 8) +
    "-" +
    uuid.slice(8, 12) +
    "-4" +
    uuid.slice(13, 16) +
    "-" +
    ((parseInt(uuid.slice(16, 18), 16) & 0x3f) | 0x80).toString(16) +
    uuid.slice(18, 20) +
    "-" +
    uuid.slice(20, 32)
  );
}
