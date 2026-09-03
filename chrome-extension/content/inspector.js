(function() {
  if (window._qaInspectorCleanup) {
    try { window._qaInspectorCleanup(); } catch (e) {}
  }

  window._qaInspectorActive = false;
  let hoveredElement = null;
  let currentSelectedElement = null;
  let tooltipEl = null;
  let modalEl = null;

  let currentLocators = {};

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

  function handleMouseOver(e) {
    if (!window._qaInspectorActive) return;
    if (modalEl && modalEl.contains(e.target)) return; 
    
    e.stopPropagation();
    hoveredElement = e.target;
    hoveredElement.classList.add('qa-inspector-highlight');

    const tag = hoveredElement.tagName.toLowerCase();
    const id = hoveredElement.id ? `#${hoveredElement.id}` : '';
    const classes = Array.from(hoveredElement.classList)
      .filter(c => c !== 'qa-inspector-highlight' && c !== 'qa-inspector-selected' && c !== 'qa-playground-match')
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
      tooltipEl.style.left = (e.clientX + 15) + 'px';
      tooltipEl.style.top = (e.clientY + 15) + 'px';
    }
  }

  function getCssSelector(el) {
    if (el.id) return `#${el.id}`;
    if (el.hasAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`;
    
    let path = [];
    while (el && el.nodeType === Node.ELEMENT_NODE) {
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
    
    if (tag === 'button' && text) return `page.getByRole('button', { name: '${text.replace(/'/g, "\\'")}' })`;
    if (tag === 'a' && text) return `page.getByRole('link', { name: '${text.replace(/'/g, "\\'")}' })`;
    
    if (el.labels && el.labels.length > 0) {
      return `page.getByLabel('${el.labels[0].innerText.trim().replace(/'/g, "\\'")}')`;
    }
    
    if (el.placeholder) return `page.getByPlaceholder('${el.placeholder.replace(/'/g, "\\'")}')`;
    
    if (text && text.length > 3) return `page.getByText('${text.replace(/'/g, "\\'")}')`;
    return `page.locator('${getCssSelector(el).replace(/'/g, "\\'")}')`;
  }

  function getFallbackText(el) {
      if (el.children.length === 0 && el.textContent && el.textContent.trim().length > 0 && el.textContent.trim().length < 50) {
          return `page.locator('//*[contains(text(), "${el.textContent.trim().replace(/"/g, '\\"')}")]')`;
      }
      return `/* No stable text found for fallback */`;
  }

  function getRelativeLocator(el) {
      let sib = el.previousElementSibling;
      while (sib) {
          if (sib.children.length === 0 && sib.textContent && sib.textContent.trim().length > 0 && sib.textContent.trim().length < 50) {
              const text = sib.textContent.trim().replace(/"/g, '\\"').replace(/\n/g, ' ');
              const tag = el.tagName.toLowerCase();
              return `page.locator('${tag}').rightOf(page.getByText("${text}"))`;
          }
          sib = sib.previousElementSibling;
      }
      if (el.labels && el.labels.length > 0) {
          const text = el.labels[0].textContent.trim().replace(/"/g, '\\"').replace(/\n/g, ' ');
          return `page.getByLabel("${text}")`;
      }
      return `/* No viable relative anchor found nearby */`;
  }

  function getAncestry(el) {
    const ancestry = [];
    let current = el;
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      ancestry.unshift(current);
      current = current.parentElement;
    }
    return ancestry;
  }

  function renderModal(target) {
    const css = getCssSelector(target);
    const xpath = getXPath(target);
    const pw = getPlaywrightLocator(target);
    const cypress = `cy.get('${css.replace(/'/g, "\\'")}')`;
    const sel = `By.css("${css.replace(/"/g, '\\"')}")`;

    currentLocators = { pw, cypress, sel, css, xpath };

    let fragilityWarning = '';
    const hasNthChild = css.match(/nth-of-type\(([3-9]|\d{2,})\)/);
    const hasDynamicClass = css.match(/\\.(css|sc|jss)-[a-zA-Z0-9_-]+/) || css.match(/\\.[a-zA-Z0-9]{5,}_[a-zA-Z0-9]{5,}/);
    if (hasNthChild || hasDynamicClass) {
        fragilityWarning += `<div style="background: rgba(239, 68, 68, 0.15); color: #f87171; font-size: 11px; padding: 8px 10px; border-radius: 4px; border: 1px solid #7f1d1d; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
           Fragile Locator Detected: Relies on dynamic classes or structure. Consider using data-testid.
        </div>`;
    }

    if (window !== window.top) {
        fragilityWarning += `<div style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; font-size: 11px; padding: 8px 10px; border-radius: 4px; border: 1px solid #1e3a8a; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
           iFrame Context Detected: Element is inside an iframe. You must switch to this iframe before interacting with it.
        </div>`;
    }

    let isShadow = false;
    let curr = target.parentNode;
    while(curr) {
       if (curr instanceof ShadowRoot) { isShadow = true; break; }
       curr = curr.parentNode || curr.host;
    }
    
    if (isShadow) {
        fragilityWarning += `<div style="background: rgba(168, 85, 247, 0.15); color: #c084fc; font-size: 11px; padding: 8px 10px; border-radius: 4px; border: 1px solid #581c87; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
           Shadow DOM Piercing Required: Element is hidden inside a web component.
        </div>`;
    }

    const computed = window.getComputedStyle(target);
    const isVisible = target.offsetWidth > 0 && target.offsetHeight > 0 && computed.visibility !== 'hidden' && computed.display !== 'none';
    const isEnabled = !target.hasAttribute('disabled');
    const stateHtml = `
       <div style="display: flex; gap: 8px; margin-bottom: 12px;">
          <span style="background: #18181b; border: 1px solid #3f3f46; padding: 4px 8px; border-radius: 4px; font-size: 10px; color: #a1a1aa; display: flex; align-items: center; gap: 6px;">
             <div style="width: 6px; height: 6px; border-radius: 50%; background: ${isVisible ? '#10b981' : '#ef4444'};"></div> ${isVisible ? 'Visible' : 'Hidden'}
          </span>
          <span style="background: #18181b; border: 1px solid #3f3f46; padding: 4px 8px; border-radius: 4px; font-size: 10px; color: #a1a1aa; display: flex; align-items: center; gap: 6px;">
             <div style="width: 6px; height: 6px; border-radius: 50%; background: ${isEnabled ? '#10b981' : '#ef4444'};"></div> ${isEnabled ? 'Enabled' : 'Disabled'}
          </span>
          <span style="background: #18181b; border: 1px solid #3f3f46; padding: 4px 8px; border-radius: 4px; font-size: 10px; color: #a1a1aa; font-family: monospace;">
             &lt;${target.tagName.toLowerCase()}&gt;
          </span>
       </div>
    `;

    const ancestry = getAncestry(target);
    const breadcrumbHtml = ancestry.slice(-4).map((el, index) => {
      let label = el.tagName.toLowerCase();
      if (el.id) label += `#${el.id}`;
      else if (el.classList.length > 0 && el.classList[0] !== 'qa-inspector-highlight' && el.classList[0] !== 'qa-inspector-selected') label += `.${el.classList[0]}`;
      return `<span class="qa-breadcrumb-item" data-index="${ancestry.length - 4 + index}">${label}</span>`;
    }).join(' <span style="color:#52525b; font-size:10px;">></span> ');

    modalEl.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #27272a; padding-bottom: 12px;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
          Element Inspected
        </h3>
        <div style="display: flex; align-items: center; gap: 4px;">
          <button id="qa-export-vscode" style="background: #2563eb; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 10px; cursor: pointer; display: flex; align-items: center; gap: 4px; font-weight: 500; margin-right: 4px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            Send to VS Code
          </button>
          <button id="qa-inspector-reselect" class="qa-close-btn" title="Reselect Element" style="color: #60a5fa;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
          </button>
          <button class="qa-close-btn" id="qa-inspector-close" title="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
      </div>

      ${fragilityWarning}
      ${stateHtml}
      
      <!-- DOM Ancestry -->
      <div style="margin-bottom: 12px;">
        <div class="qa-locator-label" style="margin-bottom:4px;">DOM Ancestry (Click parent to select)</div>
        <div class="qa-breadcrumb">${breadcrumbHtml}</div>
      </div>

      <!-- Action Generator -->
      <div style="margin-bottom: 16px; display: flex; gap: 8px; align-items: center;">
        <span class="qa-locator-label" style="margin:0;">Append Code:</span>
        <select id="qa-action-select" class="qa-select">
          <option value="">None (Just Locator)</option>
          <optgroup label="Actions">
             <option value="click">.click()</option>
             <option value="fill">.fill('test')</option>
             <option value="hover">.hover()</option>
          </optgroup>
          <optgroup label="Assertions">
             <option value="assert_visible">Assert: Visible</option>
             <option value="assert_text">Assert: Has Text</option>
          </optgroup>
        </select>
      </div>

      <div class="qa-locator-list">
        <div class="qa-locator-row">
          <div class="qa-locator-header">
            <span class="qa-locator-label">Playwright</span>
            <button class="qa-copy-btn" id="copy-pw">Copy</button>
          </div>
          <div class="qa-locator-value" id="val-pw">${pw}</div>
        </div>
        <div class="qa-locator-row">
          <div class="qa-locator-header">
            <span class="qa-locator-label">Cypress</span>
            <button class="qa-copy-btn" id="copy-cy">Copy</button>
          </div>
          <div class="qa-locator-value" id="val-cy">${cypress}</div>
        </div>
        <div class="qa-locator-row">
          <div class="qa-locator-header">
            <span class="qa-locator-label">Selenium</span>
            <button class="qa-copy-btn" id="copy-sel">Copy</button>
          </div>
          <div class="qa-locator-value" id="val-sel">${sel}</div>
        </div>
        <div class="qa-locator-row">
          <div class="qa-locator-header">
            <span class="qa-locator-label">CSS / XPath (Raw)</span>
          </div>
          <div style="display:flex; gap:8px;">
             <input type="text" readonly value="${css.replace(/"/g, '&quot;')}" class="qa-raw-input" style="flex:1;">
             <button class="qa-copy-btn" id="copy-css">Copy CSS</button>
          </div>
          <div style="display:flex; gap:8px; margin-top:4px;">
             <input type="text" readonly value="${xpath.replace(/"/g, '&quot;')}" class="qa-raw-input" style="flex:1;">
             <button class="qa-copy-btn" id="copy-xpath">Copy XPath</button>
          </div>
        </div>
      </div>

      <!-- Advanced Strategies -->
      <div style="margin-top: 16px; border-top: 1px solid #27272a; padding-top: 12px;">
        <details>
           <summary style="font-size: 11px; font-weight: 600; color: #a1a1aa; cursor: pointer; user-select: none;">
             Advanced Strategies (Relative & Fallbacks)
           </summary>
           <div style="margin-top: 8px; padding-left: 12px; border-left: 2px solid #3f3f46; display: flex; flex-direction: column; gap: 8px;">
              <div>
                <div style="font-size: 10px; color: #60a5fa; margin-bottom: 2px;">Strategy 1: Text Content Fallback</div>
                <div style="font-family: monospace; font-size: 11px; color: #d4d4d8; background: #18181b; padding: 4px 8px; border-radius: 4px; border: 1px solid #27272a;">${getFallbackText(target)}</div>
              </div>
              <div>
                <div style="font-size: 10px; color: #60a5fa; margin-bottom: 2px;">Strategy 2: Relative to Anchor (Left/Above)</div>
                <div style="font-family: monospace; font-size: 11px; color: #d4d4d8; background: #18181b; padding: 4px 8px; border-radius: 4px; border: 1px solid #27272a;">${getRelativeLocator(target)}</div>
              </div>
           </div>
        </details>
      </div>

      <!-- Live Playground -->
      <div style="margin-top: 16px; border-top: 1px solid #27272a; padding-top: 12px;">
        <div class="qa-locator-label" style="margin-bottom:6px;">Live Playground (Test a Selector)</div>
        <div style="display: flex; gap: 8px;">
          <input type="text" id="qa-playground-input" class="qa-input" placeholder="Type CSS or XPath..." autocomplete="off">
          <button id="qa-playground-btn" class="qa-btn">Test</button>
        </div>
        <div id="qa-playground-result" style="font-size:11px; margin-top:6px; color:#a1a1aa;"></div>
      </div>
    `;
    modalEl.style.display = 'block';

    function clearHighlights() {
      if (currentSelectedElement) {
        currentSelectedElement.classList.remove('qa-inspector-selected');
        currentSelectedElement = null;
      }
      if (document.getElementById('qa-test-highlights')) {
        document.getElementById('qa-test-highlights').remove();
      }
      document.querySelectorAll('.qa-playground-match').forEach(el => el.classList.remove('qa-playground-match'));
    }

    document.getElementById('qa-export-vscode').addEventListener('click', async (e) => {
      const btn = e.target.closest('button');
      const originalText = btn.innerHTML;
      btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: qa-spin 1s linear infinite;"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg> Sending...`;
      
      try {
        const res = await fetch('http://localhost:3001/qa-studio/insert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             playwright: document.getElementById('val-pw').textContent,
             cypress: document.getElementById('val-cy').textContent,
             selenium: document.getElementById('val-sel').textContent
          })
        });
        if (res.ok) {
           btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Sent to IDE!`;
           btn.style.background = '#10b981';
        } else {
           throw new Error('Failed');
        }
      } catch (err) {
        btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> IDE not connected`;
        btn.style.background = '#ef4444';
      }
      
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '#2563eb';
      }, 3000);
    });

    document.getElementById('qa-inspector-close').addEventListener('click', () => {
      modalEl.style.display = 'none';
      clearHighlights();
    });

    document.getElementById('qa-inspector-reselect').addEventListener('click', () => {
      modalEl.style.display = 'none';
      clearHighlights();
      // Reactivate inspector mode
      window._qaInspectorActive = true;
    });

    document.getElementById('qa-action-select').addEventListener('change', (e) => {
      const action = e.target.value;
      let finalPw = currentLocators.pw;
      let finalCy = currentLocators.cypress;
      let finalSel = currentLocators.sel;

      if (action === 'click') {
         finalPw += '.click()'; finalCy += '.click()'; finalSel += '.click()';
      } else if (action === 'fill') {
         finalPw += ".fill('test data')"; finalCy += ".type('test data')"; finalSel += ".sendKeys('test data')";
      } else if (action === 'hover') {
         finalPw += '.hover()'; finalCy += '.trigger("mouseover")'; finalSel = `new Actions(driver).moveToElement(${finalSel}).perform()`;
      } else if (action === 'assert_visible') {
         finalPw = `expect(${finalPw}).toBeVisible()`;
         finalCy += ".should('be.visible')";
         finalSel = `wait.until(ExpectedConditions.visibilityOfElementLocated(${currentLocators.sel}))`;
      } else if (action === 'assert_text') {
         finalPw = `expect(${finalPw}).toHaveText('...')`;
         finalCy += ".should('have.text', '...')";
         finalSel = `assertEquals("...", driver.findElement(${currentLocators.sel}).getText())`;
      }

      document.getElementById('val-pw').textContent = finalPw;
      document.getElementById('val-cy').textContent = finalCy;
      document.getElementById('val-sel').textContent = finalSel;
    });

    const bindCopy = (btnId, valId, isInput = false) => {
      const btn = document.getElementById(btnId);
      if(!btn) return;
      btn.addEventListener('click', () => {
        let text = "";
        if (isInput) {
           text = document.getElementById(valId) ? document.getElementById(valId).value : document.querySelector('.qa-raw-input').value;
        } else {
           text = document.getElementById(valId).textContent;
        }
        navigator.clipboard.writeText(text).then(() => {
          const original = btn.textContent;
          btn.textContent = 'Copied!';
          btn.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
          btn.style.color = '#10b981';
          setTimeout(() => { btn.textContent = original; btn.style.backgroundColor = ''; btn.style.color = ''; }, 2000);
        });
      });
    };

    bindCopy('copy-pw', 'val-pw');
    bindCopy('copy-cy', 'val-cy');
    bindCopy('copy-sel', 'val-sel');
    document.getElementById('copy-css').addEventListener('click', (e) => {
       navigator.clipboard.writeText(currentLocators.css);
       e.target.textContent = 'Copied!';
       setTimeout(() => e.target.textContent = 'Copy CSS', 2000);
    });
    document.getElementById('copy-xpath').addEventListener('click', (e) => {
       navigator.clipboard.writeText(currentLocators.xpath);
       e.target.textContent = 'Copied!';
       setTimeout(() => e.target.textContent = 'Copy XPath', 2000);
    });

    const breadcrumbItems = modalEl.querySelectorAll('.qa-breadcrumb-item');
    breadcrumbItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'));
        if (!isNaN(idx) && ancestry[idx]) {
           if (currentSelectedElement) currentSelectedElement.classList.remove('qa-inspector-selected');
           currentSelectedElement = ancestry[idx];
           currentSelectedElement.classList.add('qa-inspector-selected');
           renderModal(currentSelectedElement);
        }
      });
    });

    document.getElementById('qa-playground-btn').addEventListener('click', () => {
       const rawVal = document.getElementById('qa-playground-input').value;
       const resEl = document.getElementById('qa-playground-result');
       if (!rawVal) return;
       
       if (document.getElementById('qa-test-highlights')) {
         document.getElementById('qa-test-highlights').remove();
       }
       document.querySelectorAll('.qa-playground-match').forEach(el => el.classList.remove('qa-playground-match'));

       let parsedVal = rawVal.trim();
       let isXPath = false;

       try {
         if (parsedVal.includes('cy.get(')) {
           parsedVal = parsedVal.match(/cy\.get\(['"](.*?)['"]\)/)[1];
         } else if (parsedVal.includes('By.css(')) {
           parsedVal = parsedVal.match(/By\.css\(['"](.*?)['"]\)/)[1];
         } else if (parsedVal.includes('By.xpath(')) {
           parsedVal = parsedVal.match(/By\.xpath\(['"](.*?)['"]\)/)[1];
           isXPath = true;
         } else if (parsedVal.includes('page.locator(')) {
           parsedVal = parsedVal.match(/page\.locator\(['"](.*?)['"]\)/)[1];
         } else if (parsedVal.includes('page.getByTestId(')) {
           const id = parsedVal.match(/page\.getByTestId\(['"](.*?)['"]\)/)[1];
           parsedVal = `[data-testid="${id}"]`;
         } else if (parsedVal.includes('page.getByPlaceholder(')) {
           const ph = parsedVal.match(/page\.getByPlaceholder\(['"](.*?)['"]\)/)[1];
           parsedVal = `[placeholder="${ph}"]`;
         } else if (parsedVal.includes('page.getByText(')) {
           const txt = parsedVal.match(/page\.getByText\(['"](.*?)['"]\)/)[1];
           parsedVal = `//*[contains(text(), "${txt}")]`;
           isXPath = true;
         } else if (parsedVal.includes('page.getByRole(')) {
           const nameMatch = parsedVal.match(/name:\s*['"](.*?)['"]/);
           if (nameMatch) {
             parsedVal = `//*[contains(text(), "${nameMatch[1]}")]`;
             isXPath = true;
           } else {
             const roleMatch = parsedVal.match(/page\.getByRole\(['"](.*?)['"]/);
             parsedVal = roleMatch[1]; 
           }
         }
       } catch (e) {
         parsedVal = rawVal.trim();
       }

       let matches = [];
       try {
           // Try CSS first
           matches = Array.from(document.querySelectorAll(parsedVal));
       } catch (cssError) {
           try {
               // Fallback to XPath
               const iterator = document.evaluate(parsedVal, document, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
               let node = iterator.iterateNext();
               while(node) { 
                 if(node.nodeType === 1) matches.push(node); 
                 node = iterator.iterateNext(); 
               }
           } catch (xpathError) {
               resEl.innerHTML = `❌ Invalid selector: <span style="color:#a1a1aa;">${parsedVal.replace(/</g, '&lt;')}</span>`;
               resEl.style.color = "#ef4444";
               return;
           }
       }

       if (matches.length === 0) {
         resEl.innerHTML = `⚠️ 0 elements found for: <span style="color:#a1a1aa;">${parsedVal.replace(/</g, '&lt;')}</span>`;
         resEl.style.color = "#f59e0b";
       } else {
         resEl.innerHTML = `✅ ${matches.length} element(s) found! (Highlighted in pink)`;
         resEl.style.color = "#10b981";
         
         const style = document.createElement('style');
         style.id = 'qa-test-highlights';
         document.head.appendChild(style);
         
         matches.forEach(m => { m.classList.add('qa-playground-match'); });
       }
    });
  }

  function handleClick(e) {
    if (!window._qaInspectorActive) return;
    if (modalEl && modalEl.contains(e.target)) return;

    e.preventDefault();
    e.stopPropagation();

    const target = e.target;
    
    window._qaInspectorActive = false;
    if (hoveredElement) hoveredElement.classList.remove('qa-inspector-highlight');
    tooltipEl.style.display = 'none';

    // Store globally and persist highlight
    currentSelectedElement = target;
    currentSelectedElement.classList.add('qa-inspector-selected');

    renderModal(target);
  }

  const messageListener = (request, sender, sendResponse) => {
    if (request.action === 'PING_INSPECTOR') {
      sendResponse({ alive: true });
      return true;
    }
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
        if (currentSelectedElement) currentSelectedElement.classList.remove('qa-inspector-selected');
        if (tooltipEl) tooltipEl.style.display = 'none';
        if (modalEl) modalEl.style.display = 'none';
        if (document.getElementById('qa-test-highlights')) document.getElementById('qa-test-highlights').remove();
        document.querySelectorAll('.qa-playground-match').forEach(el => el.classList.remove('qa-playground-match'));
      }
      
      sendResponse({ active: window._qaInspectorActive });
      return true;
    }
  };

  chrome.runtime.onMessage.addListener(messageListener);

  window._qaInspectorCleanup = () => {
    document.removeEventListener('mouseover', handleMouseOver, true);
    document.removeEventListener('mouseout', handleMouseOut, true);
    document.removeEventListener('mousemove', handleMouseMove, true);
    document.removeEventListener('click', handleClick, true);
    chrome.runtime.onMessage.removeListener(messageListener);
  };
})();
