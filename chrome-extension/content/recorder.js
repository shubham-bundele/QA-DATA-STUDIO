if (typeof window._qaRecorderActive === 'undefined') {
  window._qaRecorderActive = false;
  window._qaRecordedSteps = [];
  
  function getElementName(el) {
    if (el.placeholder) return el.placeholder;
    if (el.labels && el.labels.length > 0) return el.labels[0].innerText.trim();
    if (el.textContent && el.textContent.trim().length > 0 && el.textContent.trim().length < 30) return el.textContent.trim();
    if (el.name) return el.name;
    if (el.id) return el.id;
    if (el.tagName) return el.tagName.toLowerCase();
    return 'element';
  }

  function handleRecordClick(e) {
    if (!window._qaRecorderActive) return;
    
    // Don't record clicks on input fields if they are just focusing to type
    if (e.target.tagName.toLowerCase() === 'input' && e.target.type !== 'submit' && e.target.type !== 'button' && e.target.type !== 'checkbox' && e.target.type !== 'radio') {
      return; 
    }

    const name = getElementName(e.target);
    window._qaRecordedSteps.push(\Click the '\' \\);
  }

  function handleRecordChange(e) {
    if (!window._qaRecorderActive) return;
    
    const target = e.target;
    const name = getElementName(target);
    
    if (target.type === 'checkbox' || target.type === 'radio') {
      const state = target.checked ? 'Check' : 'Uncheck';
      window._qaRecordedSteps.push(\\ the '\' \\);
    } else if (target.value !== undefined) {
      // For text inputs, textareas, selects
      const val = target.value;
      if (val) {
        window._qaRecordedSteps.push(\Type '\' into the '\' input\);
      }
    }
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'TOGGLE_RECORDER') {
      window._qaRecorderActive = !window._qaRecorderActive;
      
      if (window._qaRecorderActive) {
        window._qaRecordedSteps = [];
        document.addEventListener('click', handleRecordClick, true);
        document.addEventListener('change', handleRecordChange, true);
        // We use focusout to catch typing in inputs that might not trigger 'change' reliably before a button click
        document.addEventListener('focusout', handleRecordChange, true);
      } else {
        document.removeEventListener('click', handleRecordClick, true);
        document.removeEventListener('change', handleRecordChange, true);
        document.removeEventListener('focusout', handleRecordChange, true);
      }
      
      sendResponse({ 
        active: window._qaRecorderActive, 
        steps: window._qaRecordedSteps 
      });
      return true;
    }
  });
}

