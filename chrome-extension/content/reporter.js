// Ensure we only inject once
if (typeof window._qaReporterActive === 'undefined') {
  window._qaReporterActive = false;
  let canvas = null;
  let ctx = null;
  let isDrawing = false;
  let startX = 0;
  let startY = 0;
  let rect = { x: 0, y: 0, w: 0, h: 0 };
  let doneBtn = null;

  function initReporter() {
    if (document.getElementById('qa-reporter-canvas')) return;

    canvas = document.createElement('canvas');
    canvas.id = 'qa-reporter-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '2147483646';
    canvas.style.cursor = 'crosshair';
    canvas.style.background = 'rgba(0,0,0,0.1)';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);

    ctx = canvas.getContext('2d');
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 3;

    doneBtn = document.createElement('button');
    doneBtn.id = 'qa-reporter-done';
    doneBtn.innerText = 'Generate AI Bug Report';
    doneBtn.style.position = 'fixed';
    doneBtn.style.zIndex = '2147483647';
    doneBtn.style.display = 'none';
    doneBtn.style.background = '#ef4444';
    doneBtn.style.color = 'white';
    doneBtn.style.border = 'none';
    doneBtn.style.padding = '8px 16px';
    doneBtn.style.borderRadius = '4px';
    doneBtn.style.cursor = 'pointer';
    doneBtn.style.fontWeight = 'bold';
    doneBtn.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
    document.body.appendChild(doneBtn);

    canvas.addEventListener('mousedown', (e) => {
      isDrawing = true;
      startX = e.clientX;
      startY = e.clientY;
      doneBtn.style.display = 'none';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!isDrawing) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = e.clientX - startX;
      const h = e.clientY - startY;
      ctx.strokeRect(startX, startY, w, h);
      rect = { x: startX, y: startY, w, h };
    });

    canvas.addEventListener('mouseup', (e) => {
      isDrawing = false;
      
      // Position the done button near the bottom right of the rect
      let btnX = startX + rect.w + 10;
      let btnY = startY + rect.h + 10;
      
      // Handle drawing backwards
      if (rect.w < 0) btnX = startX + 10;
      if (rect.h < 0) btnY = startY + 10;
      
      doneBtn.style.left = btnX + 'px';
      doneBtn.style.top = btnY + 'px';
      doneBtn.style.display = 'block';
    });

    doneBtn.addEventListener('click', async () => {
      doneBtn.style.display = 'none';
      canvas.style.cursor = 'wait';
      canvas.style.background = 'transparent'; // Remove dimming for screenshot
      
      // Give the browser a split second to repaint without the button
      setTimeout(() => {
        chrome.runtime.sendMessage({ action: 'CAPTURE_AND_REPORT' }, (response) => {
          cleanupReporter();
          if (response && response.success) {
            alert("Bug report generated! Check the new tab.");
          } else {
            alert("Failed to generate report: " + (response ? response.error : 'Unknown'));
          }
        });
      }, 100);
    });
  }

  function cleanupReporter() {
    window._qaReporterActive = false;
    if (canvas) canvas.remove();
    if (doneBtn) doneBtn.remove();
    canvas = null;
    doneBtn = null;
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'START_REPORTER') {
      window._qaReporterActive = true;
      initReporter();
      sendResponse({ active: true });
    }
  });
}

