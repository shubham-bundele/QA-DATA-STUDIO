chrome.runtime.onInstalled.addListener(() => {
  console.log("QA Data Studio Extension Installed.");
});

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
  
  if (request.action === 'CAPTURE_AND_REPORT') {
    (async () => {
      try {
        const dataUrl = await chrome.tabs.captureVisibleTab();
        
        const baseUrl = 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/extension/report-bug`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: dataUrl })
        });
        
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const result = await res.json();
        
        if (result.success) {
          // Open the markdown in a new tab using data URI
          const htmlContent = `<html><head><title>Bug Report</title><style>body{font-family:sans-serif; max-width:800px; margin:40px auto; padding:20px; line-height:1.6;} pre{background:#f4f4f4; padding:10px; border-radius:5px;} img{max-width:100%; border:1px solid #ccc;}</style></head><body><h1>AI Bug Report</h1><div>${result.data.replace(/\\n/g, '<br>')}</div><hr><h3>Original Screenshot</h3><img src="${dataUrl}" /></body></html>`;
          
          const url = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent);
          chrome.tabs.create({ url });
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: result.error });
        }
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }
});

