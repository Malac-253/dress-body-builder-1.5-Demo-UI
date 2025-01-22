// main.js
// Example front-end script to fetch and execute JS code from your Django API with guest user token and access code.

// 1. API base URLs for local dev or production on Render:
const LOCAL_API_BASE = "http://127.0.0.1:8000";
const PROD_API_BASE = "https://dress-body-builder-2.onrender.com";
const USE_PROD = true // true or false; // Change to true for production

const API_BASE = USE_PROD ? PROD_API_BASE : LOCAL_API_BASE;

// 2. Guest user token (you need to retrieve this from the Django admin or generate it during deployment)
const GUEST_USER_TOKEN = "e41cac5b45048591b81cf84a7070e78765a58be6"; // Replace this with the actual token for the guest user

// 3. Example Access Code
const ACCESS_CODE = "x5uaGqOZAJJ1GR4LLEMRK05axCgtDGim"; // Replace this with the actual access code

// 4. Example ID or slug for the animation/story you want:
const animationId = "1"; // Replace with a valid animation ID

async function fetchAndExecuteAnimation() {
  try {
    // API endpoint to fetch the animation details
    const url = `${API_BASE}/api/function-animations/${animationId}/?access_code=${ACCESS_CODE}`;

    // Fetch the animation data using the guest user's token and access code
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Token ${GUEST_USER_TOKEN}`, // Authorization with the guest user token
        access_code: ACCESS_CODE, // Custom header for access code
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    // The API presumably returns JSON with a 'js_code' field (minified or unminified).
    const data = await response.json();
    console.log("Fetched animation data:", data);

    // // Check if we have js_code
    // if (data.js_code) {
    //   // Option A: Evaluate code directly (simple approach)
    //   //    *** Security note: eval() can be risky if code is from untrusted sources.
    //   eval(data.js_code);

    //   // Suppose the code defines a function named `runAnimation()`:
    //   if (typeof runAnimation === "function") {
    //     runAnimation();
    //   }
    // } else {
    //   console.warn("No js_code found in this record.");
    // }
  } catch (error) {
    console.error("Error fetching/executing animation code: ", error);
  }
}

// Kick it off immediately
fetchAndExecuteAnimation();
