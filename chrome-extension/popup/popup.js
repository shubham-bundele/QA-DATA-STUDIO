document.addEventListener('DOMContentLoaded', () => {
  const fillFormBtn = document.getElementById('fill-form-btn');
  const inspectorBtn = document.getElementById('inspector-btn');
  const recorderBtn = document.getElementById('recorder-btn');
  const scannerBtn = document.getElementById('scanner-btn');
  const statusDiv = document.getElementById('status');

  fillFormBtn.addEventListener('click', async () => {
    statusDiv.textContent = 'Analyzing form...';
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) throw new Error("No active tab found");

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/filler.js']
      });

      chrome.tabs.sendMessage(tab.id, { action: 'FILL_FORM' }, (response) => {
        if (chrome.runtime.lastError) {
          statusDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
        } else if (response && response.success) {
          statusDiv.textContent = 'Form filled successfully!';
        } else {
          statusDiv.textContent = 'Failed to fill form.';
        }
      });
    } catch (err) {
      statusDiv.textContent = 'Error: ' + err.message;
    }
  });

  inspectorBtn.addEventListener('click', async () => {
    statusDiv.textContent = 'Starting Locator Inspector...';
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) throw new Error("No active tab found");

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/inspector.js']
      });

      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        css: `
          .qa-inspector-highlight {
            outline: 2px dashed #4f46e5 !important;
            background-color: rgba(79, 70, 229, 0.1) !important;
            cursor: crosshair !important;
          }
          #qa-inspector-tooltip {
            position: fixed;
            z-index: 2147483647;
            background: #111827;
            color: #fff;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-family: monospace;
            pointer-events: none;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          #qa-inspector-modal {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 2147483647;
            background: white;
            color: #111827;
            padding: 16px;
            border-radius: 8px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            width: 350px;
            max-height: 80vh;
            overflow-y: auto;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            border: 1px solid #e5e7eb;
          }
          #qa-inspector-modal h3 { margin-top: 0; margin-bottom: 12px; font-size: 14px; }
          .qa-locator-row { margin-bottom: 8px; }
          .qa-locator-label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 2px; }
          .qa-locator-value { font-size: 12px; font-family: monospace; background: #f3f4f6; padding: 6px; border-radius: 4px; word-break: break-all; user-select: all; cursor: text; }
          .qa-close-btn { background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; float: right; font-size: 12px; }
        `
      });

      chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_INSPECTOR' }, (response) => {
        if (chrome.runtime.lastError) {
          statusDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
        } else if (response && response.active) {
          statusDiv.textContent = 'Inspector ACTIVE. Click elements on the page!';
          inspectorBtn.textContent = 'Stop Locator Inspector';
          inspectorBtn.style.backgroundColor = '#ef4444';
        } else {
          statusDiv.textContent = 'Inspector stopped.';
          inspectorBtn.textContent = 'Start Locator Inspector';
          inspectorBtn.style.backgroundColor = '';
        }
      });
    } catch (err) {
      statusDiv.textContent = 'Error: ' + err.message;
    }
  });

  recorderBtn.addEventListener('click', async () => {
    statusDiv.textContent = 'Starting AI Test Recorder...';
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) throw new Error("No active tab found");

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/recorder.js']
      });

      chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_RECORDER' }, (response) => {
        if (chrome.runtime.lastError) {
          statusDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
        } else if (response && response.active) {
          statusDiv.textContent = 'Recording ACTIVE. Perform your test actions...';
          recorderBtn.textContent = 'Stop & Generate Script';
          recorderBtn.style.backgroundColor = '#ef4444';
        } else if (response && !response.active) {
          statusDiv.textContent = 'Generating automation script... please wait.';
          recorderBtn.textContent = 'Start AI Test Recorder';
          recorderBtn.style.backgroundColor = '';
          
          if (response.steps && response.steps.length > 0) {
            const userStory = response.steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
            chrome.runtime.sendMessage({
              action: 'API_CALL',
              endpoint: '/api/automation/generate',
              payload: { userStory, framework: 'Playwright (TypeScript)' }
            }, (apiRes) => {
              if (apiRes && apiRes.success) {
                statusDiv.textContent = 'Script Generated! Check the console.';
                const encodedStory = encodeURIComponent(userStory);
                chrome.tabs.create({ url: `http://localhost:3000/automation-builder?story=${encodedStory}` });
              } else {
                statusDiv.textContent = 'Generation Failed: ' + (apiRes ? apiRes.error : 'Unknown error');
              }
            });
          } else {
             statusDiv.textContent = 'No actions recorded.';
          }
        }
      });
    } catch (err) {
      statusDiv.textContent = 'Error: ' + err.message;
    }
  });

  if (scannerBtn) {
    scannerBtn.addEventListener('click', async () => {
      statusDiv.textContent = 'Extracting DOM for A11y scan...';
      scannerBtn.disabled = true;
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) throw new Error("No active tab found");

        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => document.documentElement.outerHTML
        });

        const html = results[0].result;

        statusDiv.textContent = 'Sending to AI orchestrator...';

        chrome.runtime.sendMessage({
          action: 'API_CALL',
          endpoint: '/api/run-a11y-scan',
          payload: { html, wcagLevel: 'wcag2aa' }
        }, (apiRes) => {
          scannerBtn.disabled = false;
          if (apiRes && apiRes.success) {
            statusDiv.textContent = 'Scan Complete! Redirecting...';
            chrome.storage.local.set({ lastA11yScan: apiRes.data }, () => {
              chrome.tabs.create({ url: `http://localhost:3000/accessibility-scanner?fromExtension=true` });
            });
          } else {
            statusDiv.textContent = 'Scan Failed: ' + (apiRes ? apiRes.error : 'Unknown error');
          }
        });

      } catch (err) {
        scannerBtn.disabled = false;
        statusDiv.textContent = 'Error: ' + err.message;
      }
    });
  }

  const bugBtn = document.getElementById('bug-btn');
  if (bugBtn) {
    bugBtn.addEventListener('click', async () => {
      statusDiv.textContent = 'Starting Visual Bug Reporter...';
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) throw new Error("No active tab found");

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content/reporter.js']
        });

        chrome.tabs.sendMessage(tab.id, { action: 'START_REPORTER' }, (response) => {
          if (chrome.runtime.lastError) {
            statusDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
          } else {
            statusDiv.textContent = 'Draw a box over the bug on the page!';
          }
        });
      } catch (err) {
        statusDiv.textContent = 'Error: ' + err.message;
      }
    });
  }
});
