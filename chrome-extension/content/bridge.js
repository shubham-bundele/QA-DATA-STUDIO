// This content script acts as a bridge between the Next.js app and the Chrome Extension
// It runs on localhost:3000 to facilitate data transfer (like A11y scan results)

window.addEventListener('message', (event) => {
    // We only accept messages from ourselves
    if (event.source !== window) return;

    if (event.data && event.data.type === 'A11Y_REQUEST_DATA') {
        // The web app is asking for the latest A11y scan data
        chrome.storage.local.get(['lastA11yScan'], (result) => {
            if (result.lastA11yScan) {
                // Send the data back to the web app
                window.postMessage({
                    type: 'A11Y_SCAN_RESULTS',
                    payload: result.lastA11yScan
                }, '*');
                
                // Optionally clear it so it doesn't pollute storage forever
                // chrome.storage.local.remove('lastA11yScan');
            }
        });
    }
});

