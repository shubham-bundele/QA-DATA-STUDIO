chrome.runtime.onInstalled.addListener(() => {
  console.log("QA Data Studio Extension Installed.");
});

// We will use this file later for cross-origin fetch requests to the Next.js API
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'API_CALL') {
    (async () => {
      try {
        const baseUrl = 'http://localhost:3000'; // Will be updated to production URL later
        const res = await fetch(`${baseUrl}${request.endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request.payload)
        });
        
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        sendResponse({ success: true, data });
      } catch (err) {
        console.error("API Call Failed:", err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // Keep the message channel open for the async response
  }
});
