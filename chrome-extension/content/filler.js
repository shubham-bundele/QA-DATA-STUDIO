// Ensure we only add the listener once
if (!window._qaFillerInjected) {
  window._qaFillerInjected = true;

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'FILL_FORM') {
      fillForm().then((success) => sendResponse({ success })).catch(() => sendResponse({ success: false }));
      return true; // Keep channel open
    }
  });

  async function fillForm() {
    // 1. Scrape inputs
    const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select'));
    
    if (inputs.length === 0) {
      alert("QA Data Studio: No fillable form fields found on this page.");
      return false;
    }

    const fieldsSchema = inputs.map((input, index) => {
      // Create a unique temporary ID if one doesn't exist so we can map it back
      const uniqueId = input.id || input.name || `qa_temp_id_${index}`;
      input.setAttribute('data-qa-id', uniqueId);
      
      let labelText = '';
      if (input.labels && input.labels.length > 0) {
        labelText = input.labels[0].innerText;
      } else {
        const parentLabel = input.closest('label');
        if (parentLabel) labelText = parentLabel.innerText;
      }

      return {
        id: uniqueId,
        type: input.type || input.tagName.toLowerCase(),
        placeholder: input.placeholder || '',
        name: input.name || '',
        label: labelText.trim()
      };
    });

    // 2. Send to background script
    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: 'API_CALL',
          endpoint: '/api/extension/fill-form',
          payload: { fields: fieldsSchema }
        }, (res) => {
          if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
          resolve(res);
        });
      });

      if (!response || !response.success) {
        throw new Error(response.error || "Failed to generate data");
      }

      // 3. Inject data back into DOM
      const generatedData = response.data.data; // The inner data array from our API
      
      for (const item of generatedData) {
        const el = document.querySelector(`[data-qa-id="${item.id}"]`);
        if (el) {
          if (el.type === 'checkbox' || el.type === 'radio') {
            el.checked = !!item.value;
          } else {
            el.value = item.value;
          }
          // Dispatch events so React/Angular/Vue recognize the change
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }

      return true;
    } catch (err) {
      console.error("QA Data Studio: Error filling form", err);
      alert("QA Data Studio: Failed to fill form. " + err.message);
      return false;
    }
  }
}

