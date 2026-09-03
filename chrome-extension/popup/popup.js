document.addEventListener('DOMContentLoaded', () => {
  const fillFormBtn = document.getElementById('fill-form-btn');
  const inspectorBtn = document.getElementById('inspector-btn');
  const recorderBtn = document.getElementById('recorder-btn');
  const statusDiv = document.getElementById('status');

  fillFormBtn.addEventListener('click', async () => {
    statusDiv.textContent = 'Analyzing form...';
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) throw new Error("No active tab found");

      // Inject the filler content script if not already injected
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/filler.js']
      });

      // Send a message to start filling
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
    statusDiv.textContent = 'Inspector coming soon in Phase 2!';
  });

  recorderBtn.addEventListener('click', async () => {
    statusDiv.textContent = 'Recorder coming soon in Phase 3!';
  });
});

