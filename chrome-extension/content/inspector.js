// Ensure we only inject once
if (typeof window._qaInspectorActive === 'undefined') {
  window._qaInspectorActive = false;
  let hoveredElement = null;
  let tooltipEl = null;
  let modalEl = null;

  // Initialize UI elements
  function initUI() {
    if (!document.getElementById('qa-inspector-tooltip')) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'qa-inspector-tooltip';
      tooltipEl.style.display = 'none';
      document.body.appendChild(tooltipEl);
    } else {
      tooltipEl = document.getElementById('qa-inspector-tooltip');
    }

    if (!document.getElementById('qa-inspector-modal')) {
      modalEl = document.createElement('div');
      modalEl.id = 'qa-inspector-modal';
      modalEl.style.display = 'none';
      document.body.appendChild(modalEl);
    } else {
      modalEl = document.getElementById('qa-inspector-modal');
    }
  }

  initUI();

  // Highlight logic
  function handleMouseOver(e) {
    if (!window._qaInspectorActive) return;
    if (modalEl && modalEl.contains(e.target)) return; // Ignore our own modal
    
    e.stopPropagation();
    hoveredElement = e.target;
    hoveredElement.classList.add('qa-inspector-highlight');

    // Update tooltip
    const tag = hoveredElement.tagName.toLowerCase();
    const id = hoveredElement.id ? `#${hoveredElement.id}` : '';
    const classes = Array.from(hoveredElement.classList)
      .filter(c => c !== 'qa-inspector-highlight')
      .map(c => `.${c}`).join('');
    
    tooltipEl.textContent = `${tag}${id}${classes}`;
    tooltipEl.style.display = 'block';
  }

  function handleMouseOut(e) {
    if (!window._qaInspectorActive) return;
    if (hoveredElement) {
      hoveredElement.classList.remove('qa-inspector-highlight');
    }
    tooltipEl.style.display = 'none';
  }

  function handleMouseMove(e) {
    if (!window._qaInspectorActive) return;
    if (tooltipEl.style.display === 'block') {
      // Offset slightly from cursor
      tooltipEl.style.left = (e.clientX + 15) + 'px';
      tooltipEl.style.top = (e.clientY + 15) + 'px';
    }
  }

  // Locator Generators
  function getCssSelector(el) {
    if (el.id) return `#${el.id}`;
    if (el.hasAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`;
    
    let path = [];
    while (el.nodeType === Node.ELEMENT_NODE) {
      let selector = el.nodeName.toLowerCase();
      if (el.id) {
        selector += `#${el.id}`;
        path.unshift(selector);
        break;
      } else {
        let sib = el, nth = 1;
        while (sib = sib.previousElementSibling) {
          if (sib.nodeName.toLowerCase() == selector) nth++;
        }
        if (nth != 1) selector += `:nth-of-type(${nth})`;
      }
      path.unshift(selector);
      el = el.parentNode;
    }
    return path.join(" > ");
  }

  function getXPath(el) {
    if (el.id) return `//*[@id="${el.id}"]`;
    if (el.hasAttribute('data-testid')) return `//*[@data-testid="${el.getAttribute('data-testid')}"]`;
    
    const parts = [];
    while (el && el.nodeType === Node.ELEMENT_NODE) {
      let nbOfPreviousSiblings = 0;
      let hasNextSiblings = false;
      let sibling = el.previousSibling;
      while (sibling) {
        if (sibling.nodeType !== Node.DOCUMENT_TYPE_NODE && sibling.nodeName == el.nodeName) {
          nbOfPreviousSiblings++;
        }
        sibling = sibling.previousSibling;
      }
      sibling = el.nextSibling;
      while (sibling) {
        if (sibling.nodeName == el.nodeName) {
          hasNextSiblings = true;
          break;
        }
        sibling = sibling.nextSibling;
      }
      const prefix = el.prefix ? el.prefix + ':' : '';
      const nth = nbOfPreviousSiblings || hasNextSiblings ? `[${nbOfPreviousSiblings + 1}]` : '';
      parts.push(prefix + el.localName + nth);
      el = el.parentNode;
    }
    return parts.length ? '/' + '/' + parts.reverse().join('/') : '';
  }

  function getPlaywrightLocator(el) {
    if (el.hasAttribute('data-testid')) return `page.getByTestId('${el.getAttribute('data-testid')}')`;
    const text = (el.textContent || '').trim().substring(0, 30);
    const tag = el.tagName.toLowerCase();
    
    if (tag === 'button' && text) return `page.getByRole('button', { name: '${text}' })`;
    if (tag === 'a' && text) return `page.getByRole('link', { name: '${text}' })`;
    
    if (el.labels && el.labels.length > 0) {
      return `page.getByLabel('${el.labels[0].innerText.trim()}')`;
    }
    
    if (el.placeholder) return `page.getByPlaceholder('${el.placeholder}')`;
    
    if (text && text.length > 3) return `page.getByText('${text}')`;
    return `page.locator('${getCssSelector(el)}')`;
  }

  function handleClick(e) {
    if (!window._qaInspectorActive) return;
    if (modalEl && modalEl.contains(e.target)) return;

    e.preventDefault();
    e.stopPropagation();

    const target = e.target;
    
    // Stop inspecting immediately
    window._qaInspectorActive = false;
    if (hoveredElement) hoveredElement.classList.remove('qa-inspector-highlight');
    tooltipEl.style.display = 'none';

    // Calculate locators
    const css = getCssSelector(target);
    const xpath = getXPath(target);
    const pw = getPlaywrightLocator(target);
    const cypress = `cy.get('${css.replace(/'/g, "\\'")}')`;

    // Show modal
    modalEl.innerHTML = `
      <button class="qa-close-btn" id="qa-inspector-close">Close</button>
      <h3>Element Inspected</h3>
      
      <div class="qa-locator-row">
        <div class="qa-locator-label">Playwright</div>
        <div class="qa-locator-value">${pw}</div>
      </div>
      <div class="qa-locator-row">
        <div class="qa-locator-label">Cypress</div>
        <div class="qa-locator-value">${cypress}</div>
      </div>
      <div class="qa-locator-row">
        <div class="qa-locator-label">CSS Selector</div>
        <div class="qa-locator-value">${css}</div>
      </div>
      <div class="qa-locator-row">
        <div class="qa-locator-label">XPath</div>
        <div class="qa-locator-value">${xpath}</div>
      </div>
    `;
    modalEl.style.display = 'block';

    document.getElementById('qa-inspector-close').addEventListener('click', () => {
      modalEl.style.display = 'none';
    });
  }

  // Toggle listener
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'TOGGLE_INSPECTOR') {
      window._qaInspectorActive = !window._qaInspectorActive;
      
      if (window._qaInspectorActive) {
        document.addEventListener('mouseover', handleMouseOver, true);
        document.addEventListener('mouseout', handleMouseOut, true);
        document.addEventListener('mousemove', handleMouseMove, true);
        document.addEventListener('click', handleClick, true);
      } else {
        document.removeEventListener('mouseover', handleMouseOver, true);
        document.removeEventListener('mouseout', handleMouseOut, true);
        document.removeEventListener('mousemove', handleMouseMove, true);
        document.removeEventListener('click', handleClick, true);
        
        if (hoveredElement) hoveredElement.classList.remove('qa-inspector-highlight');
        if (tooltipEl) tooltipEl.style.display = 'none';
      }
      
      sendResponse({ active: window._qaInspectorActive });
      return true;
    }
  });
}

