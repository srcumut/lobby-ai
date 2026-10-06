// Test open redirect defense and path validation logic
function getSafeRedirectTarget(rawTarget) {
  if (!rawTarget) return "/lobbies";

  try {
    let decoded = decodeURIComponent(rawTarget).trim();

    // Loop decode in case of multi-encoded payload e.g. %252Flogin
    let prev = "";
    while (decoded !== prev && decoded.includes("%")) {
      prev = decoded;
      try {
        decoded = decodeURIComponent(decoded).trim();
      } catch {
        break;
      }
    }

    // Must be a relative path starting with '/' and not '//' or '/\' (blocks protocol-relative open redirects)
    if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.startsWith("/\\")) {
      return "/lobbies";
    }

    // Parse the path portion to check against forbidden routes
    const pathOnly = decoded.split("?")[0].split("#")[0].toLowerCase();

    // Prevent redirect loops: do not redirect back to /login or /register
    if (
      pathOnly === "/login" ||
      pathOnly.startsWith("/login/") ||
      pathOnly === "/register" ||
      pathOnly.startsWith("/register/")
    ) {
      return "/lobbies";
    }

    return decoded;
  } catch {
    return "/lobbies";
  }
}

const testCases = [
  // Benign cases
  { input: "/profile", expected: "/profile" },
  { input: "/shop", expected: "/shop" },
  { input: "/messages", expected: "/messages" },
  { input: "/community", expected: "/community" },
  { input: "/lobby/123-abc", expected: "/lobby/123-abc" },
  // Open redirect attempts
  { input: "https://evil.com", expected: "/lobbies" },
  { input: "http://evil.com", expected: "/lobbies" },
  { input: "//evil.com", expected: "/lobbies" },
  { input: "/\\evil.com", expected: "/lobbies" },
  { input: "javascript:alert(1)", expected: "/lobbies" },
  // Multi-encoded attacks
  { input: "%2F%2Fevil.com", expected: "/lobbies" },
  { input: "%252F%252Fevil.com", expected: "/lobbies" },
  // Redirect loops
  { input: "/login", expected: "/lobbies" },
  { input: "/register", expected: "/lobbies" },
  { input: "/login?redirect=/profile", expected: "/lobbies" },
  { input: "%2Flogin", expected: "/lobbies" },
  // Null / empty
  { input: null, expected: "/lobbies" },
  { input: "", expected: "/lobbies" }
];

console.log("=== TESTING OPEN REDIRECT DEFENSE ===");
let passed = 0;
let failed = 0;

for (const tc of testCases) {
  const result = getSafeRedirectTarget(tc.input);
  if (result === tc.expected) {
    console.log(`  ✅ PASS: input: "${tc.input}" -> "${result}"`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: input: "${tc.input}" -> got "${result}", expected "${tc.expected}"`);
    failed++;
  }
}

console.log(`\nResults: ${passed} PASSED, ${failed} FAILED\n`);
process.exit(failed > 0 ? 1 : 0);
