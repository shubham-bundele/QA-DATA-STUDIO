document.addEventListener('DOMContentLoaded', () => {
  const fillFormBtn = document.getElementById('fill-form-btn');
  const inspectorBtn = document.getElementById('inspector-btn');
  const recorderBtn = document.getElementById('recorder-btn');
  const scannerBtn = document.getElementById('scanner-btn');
  const securityBtn = document.getElementById('security-btn');
  const bugBtn = document.getElementById('bug-btn');
  
  const statusDiv = document.getElementById('status');
  const statusIndicator = document.getElementById('status-indicator');

  function setStatus(message, state = 'ready') {
    statusDiv.textContent = message;
    statusIndicator.className = 'status-indicator ' + state;
  }

  fillFormBtn.addEventListener('click', async () => {
    setStatus('Analyzing form...', 'busy');
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) throw new Error("No active tab found");

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/filler.js']
      });

      chrome.tabs.sendMessage(tab.id, { action: 'FILL_FORM' }, (response) => {
        if (chrome.runtime.lastError) {
          setStatus('Error: ' + chrome.runtime.lastError.message, 'error');
        } else if (response && response.success) {
          setStatus('Form filled successfully!', 'ready');
        } else {
          setStatus('Failed to fill form.', 'error');
        }
      });
    } catch (err) {
      setStatus('Error: ' + err.message, 'error');
    }
  });

  inspectorBtn.addEventListener('click', async () => {
    setStatus('Starting Locator Inspector...', 'busy');
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) throw new Error("No active tab found");

      await chrome.scripting.insertCSS({
        target: { tabId: tab.id, allFrames: true },
        css: `
          @keyframes qa-spin { 100% { transform: rotate(360deg); } }
          .qa-inspector-highlight {
            outline: 2px dashed #f59e0b !important;
            background-color: rgba(245, 158, 11, 0.15) !important;
            cursor: crosshair !important;
          }
          .qa-inspector-selected {
            outline: 3px solid #3b82f6 !important;
            background-color: rgba(59, 130, 246, 0.2) !important;
            box-shadow: 0 0 15px rgba(59, 130, 246, 0.5) !important;
          }
          #qa-inspector-tooltip {
            position: fixed;
            z-index: 2147483647;
            background: #09090b;
            color: #f4f4f5;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            pointer-events: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            border: 1px solid #27272a;
          }
          #qa-inspector-modal {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 2147483647;
            background: #09090b;
            color: #f4f4f5;
            padding: 16px;
            border-radius: 12px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
            width: 380px;
            max-height: 85vh;
            overflow-y: auto;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            border: 1px solid #27272a;
          }
          .qa-locator-list { display: flex; flex-direction: column; gap: 12px; }
          .qa-locator-row { display: flex; flex-direction: column; gap: 4px; }
          .qa-locator-header { display: flex; justify-content: space-between; align-items: center; }
          .qa-locator-label { font-size: 11px; font-weight: 600; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.05em; }
          .qa-copy-btn { background: #18181b; color: #f4f4f5; border: 1px solid #3f3f46; padding: 4px 8px; border-radius: 4px; font-size: 10px; cursor: pointer; transition: all 0.2s; font-weight: 500; }
          .qa-copy-btn:hover { background: #27272a; border-color: #52525b; }
          .qa-locator-value { font-size: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background: #18181b; color: #34d399; padding: 10px; border-radius: 6px; border: 1px solid #27272a; word-break: break-all; user-select: all; cursor: text; }
          .qa-close-btn { background: transparent; color: #a1a1aa; border: none; padding: 4px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
          .qa-close-btn:hover { color: #f4f4f5; background: #27272a; }
          
          /* Custom Scrollbar for Modal */
          #qa-inspector-modal::-webkit-scrollbar { width: 6px; }
          #qa-inspector-modal::-webkit-scrollbar-track { background: transparent; }
          #qa-inspector-modal::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 3px; }
          #qa-inspector-modal::-webkit-scrollbar-thumb:hover { background: #52525b; }

          /* New Features CSS */
          .qa-breadcrumb { display: flex; flex-wrap: wrap; gap: 4px; padding: 8px; background: #18181b; border-radius: 6px; border: 1px solid #27272a; align-items: center; }
          .qa-breadcrumb-item { color: #60a5fa; cursor: pointer; font-size: 11px; font-family: monospace; transition: color 0.2s; }
          .qa-breadcrumb-item:hover { color: #93c5fd; text-decoration: underline; }
          .qa-select { background: #18181b; color: #f4f4f5; border: 1px solid #3f3f46; border-radius: 4px; padding: 4px 8px; font-size: 11px; outline: none; }
          .qa-input { flex: 1; background: #18181b; color: #f4f4f5; border: 1px solid #3f3f46; border-radius: 4px; padding: 6px 8px; font-size: 11px; font-family: monospace; outline: none; }
          .qa-input:focus { border-color: #f59e0b; }
          .qa-btn { background: #f59e0b; color: #09090b; border: none; padding: 6px 12px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer; }
          .qa-btn:hover { background: #fbbf24; }
          .qa-raw-input { background: transparent; border: none; color: #a1a1aa; font-family: monospace; font-size: 11px; outline: none; }
          .qa-playground-match { outline: 2px solid #ec4899 !important; background-color: rgba(236, 72, 153, 0.2) !important; }
        `
      });

      chrome.tabs.sendMessage(tab.id, { action: 'PING_INSPECTOR' }, async (pingResponse) => {
        if (chrome.runtime.lastError) {
           // Not injected yet (or orphaned), inject it now
           await chrome.scripting.executeScript({
             target: { tabId: tab.id, allFrames: true },
             files: ['content/inspector.js']
           });
        }
        
        chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_INSPECTOR' }, (response) => {
          if (chrome.runtime.lastError) {
            setStatus('Error: ' + chrome.runtime.lastError.message, 'error');
          } else if (response && response.active) {
            setStatus('Inspector ACTIVE. Click elements on the page!', 'ready');
            inspectorBtn.style.border = '1px solid #ef4444';
            inspectorBtn.querySelector('.action-title').textContent = 'Stop Inspector';
          } else {
            setStatus('Inspector stopped.', 'ready');
            inspectorBtn.style.border = '';
            inspectorBtn.querySelector('.action-title').textContent = 'Locator Inspector';
          }
        });
      });
    } catch (err) {
      setStatus('Error: ' + err.message, 'error');
    }
  });

  recorderBtn.addEventListener('click', async () => {
    setStatus('Starting AI Test Recorder...', 'busy');
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) throw new Error("No active tab found");

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/recorder.js']
      });

      chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_RECORDER' }, (response) => {
        if (chrome.runtime.lastError) {
          setStatus('Error: ' + chrome.runtime.lastError.message, 'error');
        } else if (response && response.active) {
          setStatus('Recording ACTIVE. Perform your test actions...', 'ready');
          recorderBtn.style.border = '1px solid #ef4444';
          recorderBtn.querySelector('.action-title').textContent = 'Stop & Generate';
        } else if (response && !response.active) {
          setStatus('Generating automation script... please wait.', 'busy');
          recorderBtn.style.border = '';
          recorderBtn.querySelector('.action-title').textContent = 'AI Test Recorder';
          
          if (response.steps && response.steps.length > 0) {
            const userStory = response.steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
            chrome.runtime.sendMessage({
              action: 'API_CALL',
              endpoint: '/api/automation/generate',
              payload: { userStory, framework: 'Playwright (TypeScript)' }
            }, (apiRes) => {
              if (apiRes && apiRes.success) {
                setStatus('Script Generated! Check the console.', 'ready');
                const encodedStory = encodeURIComponent(userStory);
                chrome.tabs.create({ url: `http://localhost:3000/automation-builder?story=${encodedStory}` });
              } else {
                setStatus('Generation Failed: ' + (apiRes ? apiRes.error : 'Unknown error'), 'error');
              }
            });
          } else {
             setStatus('No actions recorded.', 'ready');
          }
        }
      });
    } catch (err) {
      setStatus('Error: ' + err.message, 'error');
    }
  });

  if (scannerBtn) {
    scannerBtn.addEventListener('click', async () => {
      setStatus('Extracting DOM for A11y scan...', 'busy');
      scannerBtn.disabled = true;
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) throw new Error("No active tab found");

        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => document.documentElement.outerHTML
        });

        const html = results[0].result;

        setStatus('Sending to AI orchestrator...', 'busy');

        chrome.runtime.sendMessage({
          action: 'API_CALL',
          endpoint: '/api/run-a11y-scan',
          payload: { html, wcagLevel: 'wcag2aa' }
        }, (apiRes) => {
          scannerBtn.disabled = false;
          if (apiRes && apiRes.success) {
            setStatus('Scan Complete! Redirecting...', 'ready');
            // Overwrite the 'about:blank' URL with the actual tab URL so the web app can display it
            apiRes.data.url = tab.url;
            apiRes.data.targetUrl = tab.url; // Also explicitly set targetUrl
            chrome.storage.local.set({ lastA11yScan: apiRes.data }, () => {
              chrome.tabs.create({ url: `http://localhost:3000/accessibility-scanner?fromExtension=true` });
            });
          } else {
            setStatus('Scan Failed: ' + (apiRes ? apiRes.error : 'Unknown error'), 'error');
          }
        });

      } catch (err) {
        scannerBtn.disabled = false;
        setStatus('Error: ' + err.message, 'error');
      }
    });
  }

  if (securityBtn) {
    securityBtn.addEventListener('click', async () => {
      setStatus('Launching Security Scanner...', 'busy');
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) throw new Error("No active tab found");
        
        const targetUrl = encodeURIComponent(tab.url);
        setStatus('Redirecting...', 'ready');
        chrome.tabs.create({ url: `http://localhost:3000/security-scanner?targetUrl=${targetUrl}` });
      } catch (err) {
        setStatus('Error: ' + err.message, 'error');
      }
    });
  }

  if (bugBtn) {
    bugBtn.addEventListener('click', async () => {
      setStatus('Starting Visual Bug Reporter...', 'busy');
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) throw new Error("No active tab found");

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content/reporter.js']
        });

        chrome.tabs.sendMessage(tab.id, { action: 'START_REPORTER' }, (response) => {
          if (chrome.runtime.lastError) {
            setStatus('Error: ' + chrome.runtime.lastError.message, 'error');
          } else {
            setStatus('Draw a box over the bug on the page!', 'ready');
          }
        });
      } catch (err) {
        setStatus('Error: ' + err.message, 'error');
      }
    });
  }
});
