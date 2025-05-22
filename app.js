// Combined Visual Editor and Iframe Capture + Main App Logic
// All-in-one file to avoid module issues

window.WebpageEditor = window.WebpageEditor || {};

// Ensure DEBUG exists with defaults
window.WebpageEditor.DEBUG = window.WebpageEditor.DEBUG || {
  ENABLED: false,
  LOG_PROXY_ATTEMPTS: true,
  LOG_DOM_OPERATIONS: false,
  LOG_CAPTURE_OPERATIONS: true
};

// Visual Editor class
window.WebpageEditor.VisualEditor = class {
  constructor() {
    this.editorStyles = this.generateEditorStyles();
  }

  // Generate the complete visual editor HTML
  createEditorHTML(sourceUrl, htmlContent, captureType, waitTime) {
    try {
      // Check if DocumentUtils exists
      if (!window.WebpageEditor.DocumentUtils) {
        throw new Error('DocumentUtils not loaded');
      }
      
      // Prepare the HTML content using existing DocumentUtils
      const { doc, headContent, bodyContent, basePath } = window.WebpageEditor.DocumentUtils.prepareHTML(htmlContent, sourceUrl);
      
      // Build the complete editor HTML
      return this.buildEditorDocument(sourceUrl, headContent, bodyContent, basePath, captureType, waitTime);
      
    } catch (error) {
      throw new Error(`Failed to create editor HTML: ${error.message}`);
    }
  }

  // Build the complete editor document
  buildEditorDocument(sourceUrl, headContent, bodyContent, basePath, captureType, waitTime) {
    const runScriptsButton = captureType === 'dynamic' ? 
      `<button id="run-scripts-btn" class="visual-editor-toolbar-button">Run Scripts</button>` : '';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Edit: ${sourceUrl}</title>
  <base href="${basePath}">
  ${headContent}
  ${this.editorStyles}
</head>
<body>
  <div class="visual-editor-toolbar">
    <div class="visual-editor-toolbar-title">
      Editing copy of: ${sourceUrl}
    </div>
    <div class="visual-editor-toolbar-buttons">
      <button id="save-btn" class="visual-editor-toolbar-button">Save</button>
      <button id="print-btn" class="visual-editor-toolbar-button">Print</button>
      <button id="toggle-edit-btn" class="visual-editor-toolbar-button">Toggle Edit Mode</button>
      ${runScriptsButton}
    </div>
  </div>
  
  <div class="visual-editor-content">
    ${bodyContent}
  </div>
  
  <div id="edit-tooltip" class="edit-tooltip">Click to edit</div>
  
  ${this.generateEditorScript(captureType, waitTime)}
</body>
</html>`;
  }

  // Generate CSS styles for the editor
  generateEditorStyles() {
    // Use defaults if CONFIG is not loaded
    const styles = window.WebpageEditor.CONFIG?.EDITOR_STYLES || {
      TOOLBAR_COLOR: '#4a90e2',
      HOVER_COLOR: 'rgba(74, 144, 226, 0.1)',
      FOCUS_COLOR: 'rgba(74, 144, 226, 0.15)',
      TOOLBAR_HEIGHT: '50px'
    };
    
    return `<style>
/* Visual Editor Toolbar Styles */
.visual-editor-toolbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: ${styles.TOOLBAR_COLOR};
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  z-index: 9999;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
}

.visual-editor-toolbar-title {
  font-weight: bold;
  font-size: 16px;
}

.visual-editor-toolbar-buttons {
  display: flex;
  gap: 10px;
}

.visual-editor-toolbar-button {
  background-color: white;
  color: ${styles.TOOLBAR_COLOR};
  border: none;
  border-radius: 4px;
  padding: 5px 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.visual-editor-toolbar-button:hover {
  background-color: #f0f0f0;
}

.visual-editor-toolbar-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Editable Content Indicators */
[contenteditable="true"] {
  outline: none;
  min-height: 1em;
}

[contenteditable="true"]:hover {
  background-color: ${styles.HOVER_COLOR};
  cursor: text;
}

[contenteditable="true"]:focus {
  background-color: ${styles.FOCUS_COLOR};
  border-radius: 2px;
}

/* Editor Content Container */
.visual-editor-content {
  margin-top: ${styles.TOOLBAR_HEIGHT};
  min-height: calc(100vh - ${styles.TOOLBAR_HEIGHT});
}

/* Tooltip for Editing */
.edit-tooltip {
  position: absolute;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  z-index: 9990;
  display: none;
  white-space: nowrap;
}

/* Iframe Placeholder Styles */
.iframe-placeholder {
  border: 1px dashed #ccc;
  padding: 10px;
  margin: 10px 0;
  background-color: #f9f9f9;
  text-align: center;
  color: #666;
}

/* Print Styles */
@media print {
  .visual-editor-toolbar,
  .edit-tooltip {
    display: none !important;
  }
  
  .visual-editor-content {
    margin-top: 0 !important;
  }
}
</style>`;
  }

  // Generate the editor script
  generateEditorScript(captureType, waitTime) {
    return `<script data-editor-script="true">
(function() {
  'use strict';
  
  let isEditMode = true;
  
  const saveBtn = document.getElementById('save-btn');
  const printBtn = document.getElementById('print-btn');
  const toggleEditBtn = document.getElementById('toggle-edit-btn');
  const runScriptsBtn = document.getElementById('run-scripts-btn');
  const editTooltip = document.getElementById('edit-tooltip');
  const editorContent = document.querySelector('.visual-editor-content');
  
  const waitTime = ${waitTime || 0};
  const captureType = '${captureType}';
  
  document.addEventListener('DOMContentLoaded', initVisualEditor);
  
  function initVisualEditor() {
    setTimeout(() => {
      fixFramesAndScripts();
      
      if (captureType === 'dynamic' && waitTime > 0) {
        setTimeout(() => {
          makeElementsEditable(editorContent);
          addTooltipFunctionality();
        }, waitTime * 1000);
      } else {
        makeElementsEditable(editorContent);
        addTooltipFunctionality();
      }
    }, 500);
    
    if (saveBtn) saveBtn.addEventListener('click', savePage);
    if (printBtn) printBtn.addEventListener('click', printPage);
    if (toggleEditBtn) toggleEditBtn.addEventListener('click', toggleEditMode);
    if (runScriptsBtn) runScriptsBtn.addEventListener('click', enablePageScripts);
  }
  
  function fixFramesAndScripts() {
    document.querySelectorAll('script').forEach(script => {
      if (!script.hasAttribute('data-editor-script')) {
        script.type = 'text/disabled';
      }
    });
    
    document.querySelectorAll('iframe').forEach(iframe => {
      const placeholder = document.createElement('div');
      placeholder.className = 'iframe-placeholder';
      placeholder.innerHTML = '<p>iframe content: ' + (iframe.src || 'empty') + '</p>';
      
      iframe.parentNode.insertBefore(placeholder, iframe);
      iframe.style.display = 'none';
    });
  }
  
  function makeElementsEditable(container) {
    const selector = 'p, h1, h2, h3, h4, h5, h6, span, div, a, li, td, th, strong, em, label, button, figcaption';
    const textElements = container.querySelectorAll(selector);
    
    textElements.forEach(element => {
      if (element.closest('.visual-editor-toolbar') || 
          element.closest('.edit-tooltip')) {
        return;
      }
      
      if (!element.textContent.trim()) {
        return;
      }
      
      element.setAttribute('contenteditable', 'true');
      
      if (element.tagName.toLowerCase() === 'a') {
        element.addEventListener('click', function(e) {
          if (isEditMode) {
            e.preventDefault();
          }
        });
      }
    });
  }
  
  function addTooltipFunctionality() {
    const editableElements = document.querySelectorAll('[contenteditable="true"]');
    
    editableElements.forEach(element => {
      element.addEventListener('mouseover', function(e) {
        if (isEditMode) {
          const rect = element.getBoundingClientRect();
          editTooltip.style.top = (window.scrollY + rect.top - 30) + 'px';
          editTooltip.style.left = (rect.left + rect.width/2 - 50) + 'px';
          editTooltip.style.display = 'block';
        }
      });
      
      element.addEventListener('mouseout', function() {
        editTooltip.style.display = 'none';
      });
      
      element.addEventListener('focus', function() {
        editTooltip.style.display = 'none';
      });
    });
  }
  
  function toggleEditMode() {
    isEditMode = !isEditMode;
    
    const editableElements = document.querySelectorAll('[contenteditable="true"]');
    editableElements.forEach(element => {
      element.setAttribute('contenteditable', isEditMode.toString());
    });
    
    toggleEditBtn.textContent = isEditMode ? 'Toggle Edit Mode' : 'Enable Editing';
    
    if (!isEditMode) {
      editTooltip.style.display = 'none';
    }
  }
  
  function enablePageScripts() {
    if (confirm('Enabling scripts may cause the page to change or navigate away. Continue?')) {
      document.querySelectorAll('script[type="text/disabled"]').forEach(script => {
        const newScript = document.createElement('script');
        
        Array.from(script.attributes).forEach(attr => {
          if (attr.name !== 'type') {
            newScript.setAttribute(attr.name, attr.value);
          }
        });
        
        newScript.textContent = script.textContent;
        script.parentNode.replaceChild(newScript, script);
      });
      
      document.querySelectorAll('iframe').forEach(iframe => {
        iframe.style.display = '';
        const placeholder = iframe.previousSibling;
        if (placeholder && placeholder.className === 'iframe-placeholder') {
          placeholder.parentNode.removeChild(placeholder);
        }
      });
      
      toggleEditMode();
      
      runScriptsBtn.disabled = true;
      runScriptsBtn.textContent = 'Scripts Enabled';
    }
  }
  
  function savePage() {
    try {
      const docType = document.doctype;
      const docTypeString = docType ? 
        '<!DOCTYPE ' + docType.name + 
        (docType.publicId ? ' PUBLIC "' + docType.publicId + '"' : '') +
        (docType.systemId ? ' "' + docType.systemId + '"' : '') + '>' : 
        '<!DOCTYPE html>';
      
      const editableElements = document.querySelectorAll('[contenteditable="true"]');
      editableElements.forEach(element => {
        element.removeAttribute('contenteditable');
      });
      
      const toolbar = document.querySelector('.visual-editor-toolbar');
      const tooltip = document.getElementById('edit-tooltip');
      const toolbarDisplay = toolbar.style.display;
      const tooltipDisplay = tooltip.style.display;
      
      toolbar.style.display = 'none';
      tooltip.style.display = 'none';
      
      const htmlContent = docTypeString + '\\n' + document.documentElement.outerHTML;
      
      editableElements.forEach(element => {
        element.setAttribute('contenteditable', 'true');
      });
      toolbar.style.display = toolbarDisplay;
      tooltip.style.display = tooltipDisplay;
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const filename = prompt('Enter filename to save as:', 'edited-page.html');
      
      if (filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error saving page:', error);
      alert('Failed to save the page: ' + error.message);
    }
  }
  
  function printPage() {
    const toolbar = document.querySelector('.visual-editor-toolbar');
    const tooltip = document.getElementById('edit-tooltip');
    const editableElements = document.querySelectorAll('[contenteditable="true"]');
    
    const toolbarDisplay = toolbar.style.display;
    const tooltipDisplay = tooltip.style.display;
    
    toolbar.style.display = 'none';
    tooltip.style.display = 'none';
    editableElements.forEach(element => {
      element.removeAttribute('contenteditable');
    });
    
    window.print();
    
    toolbar.style.display = toolbarDisplay;
    tooltip.style.display = tooltipDisplay;
    editableElements.forEach(element => {
      if (isEditMode) {
        element.setAttribute('contenteditable', 'true');
      }
    });
  }
})();
</script>`;
  }

  // Open the visual editor in a new tab
  static openEditor(sourceUrl, htmlContent, captureType, waitTime) {
    try {
      const editor = new window.WebpageEditor.VisualEditor();
      const editorHtml = editor.createEditorHTML(sourceUrl, htmlContent, captureType, waitTime);
      
      if (!window.WebpageEditor.DOMUtils) {
        throw new Error('DOMUtils not loaded');
      }
      
      const newTab = window.WebpageEditor.DOMUtils.createWindow();
      window.WebpageEditor.DOMUtils.writeToDocument(newTab.document, editorHtml);
      
      return newTab;
    } catch (error) {
      throw new Error(`Failed to open visual editor: ${error.message}`);
    }
  }
};

// Iframe Capture class
window.WebpageEditor.IframeCapture = class {
  constructor() {
    this.captureWindow = null;
  }

  // Open the iframe capture tool
  open(url, waitTime = 2) {
    try {
      console.log('Opening iframe capture tool...');
      
      if (!window.WebpageEditor.DOMUtils) {
        throw new Error('DOMUtils not loaded');
      }
      
      this.captureWindow = window.WebpageEditor.DOMUtils.createWindow('about:blank', '_blank', 'width=1200,height=800');
      this.createCaptureInterface(this.captureWindow, url, waitTime);
      this.captureWindow.focus();
      
      console.log('Iframe capture tool opened successfully');
      return this.captureWindow;
      
    } catch (error) {
      console.error('Error in openIframeCaptureTool:', error);
      throw error;
    }
  }

  // Create the capture interface using DOM methods
  createCaptureInterface(targetWindow, url, waitTime) {
    const doc = targetWindow.document;
    
    // Write basic HTML structure
    window.WebpageEditor.DOMUtils.writeToDocument(doc, this.getBasicHTML(url));
    
    // Add styles and interface elements
    this.addStyles(doc);
    this.createToolbar(doc, url);
    this.createLoadingMessage(doc);
    this.createErrorMessage(doc);
    this.createIframe(doc, url);
    this.addCaptureScript(doc, url, waitTime);
  }

  getBasicHTML(url) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Capturing: ${url}</title>
</head>
<body></body>
</html>`;
  }

  addStyles(doc) {
    const style = window.WebpageEditor.DOMUtils.createElement('style', {
      textContent: `
        body, html { margin: 0; padding: 0; height: 100%; font-family: Arial, sans-serif; }
        .toolbar { position: fixed; top: 0; left: 0; right: 0; background: #4a90e2; color: white; padding: 10px 20px; z-index: 9999; display: flex; justify-content: space-between; align-items: center; }
        .toolbar-title { font-weight: bold; font-size: 16px; }
        .toolbar-info { font-size: 14px; }
        .toolbar-buttons { display: flex; gap: 10px; }
        .btn { background: white; color: #4a90e2; border: none; border-radius: 4px; padding: 5px 12px; font-size: 14px; font-weight: 600; cursor: pointer; }
        .btn:hover { background: #f0f0f0; }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        iframe { width: 100%; height: calc(100vh - 50px); border: none; margin-top: 50px; }
        .loading { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.7); color: white; padding: 20px; border-radius: 8px; text-align: center; z-index: 9998; }
        .error { position: fixed; top: 60px; left: 20px; right: 20px; background: #ff4444; color: white; padding: 15px; border-radius: 5px; z-index: 9997; display: none; }
        .success { position: fixed; top: 60px; right: 20px; background: #4CAF50; color: white; padding: 15px; border-radius: 5px; z-index: 9997; display: none; }
      `
    }, doc.head);
  }

  createToolbar(doc, url) {
    const toolbar = window.WebpageEditor.DOMUtils.createElement('div', { className: 'toolbar' }, doc.body);
    
    const toolbarLeft = window.WebpageEditor.DOMUtils.createElement('div', {}, toolbar);
    window.WebpageEditor.DOMUtils.createElement('div', {
      className: 'toolbar-title',
      textContent: `Capturing: ${url}`
    }, toolbarLeft);
    window.WebpageEditor.DOMUtils.createElement('div', {
      className: 'toolbar-info',
      textContent: 'Wait for the page to load, then click "Capture Now"'
    }, toolbarLeft);
    
    const toolbarButtons = window.WebpageEditor.DOMUtils.createElement('div', { className: 'toolbar-buttons' }, toolbar);
    
    window.WebpageEditor.DOMUtils.createElement('button', {
      className: 'btn',
      textContent: 'Capture Now',
      id: 'capture-btn'
    }, toolbarButtons);
    
    window.WebpageEditor.DOMUtils.createElement('button', {
      className: 'btn',
      textContent: 'Wait + Capture',
      id: 'wait-btn'
    }, toolbarButtons);
  }

  createLoadingMessage(doc) {
    window.WebpageEditor.DOMUtils.createElement('div', {
      className: 'loading',
      id: 'loading-message',
      innerHTML: '<div>Loading page, please wait...</div>'
    }, doc.body);
  }

  createErrorMessage(doc) {
    window.WebpageEditor.DOMUtils.createElement('div', {
      className: 'error',
      id: 'error-msg'
    }, doc.body);

    window.WebpageEditor.DOMUtils.createElement('div', {
      className: 'success',
      id: 'success-msg'
    }, doc.body);
  }

  createIframe(doc, url) {
    window.WebpageEditor.DOMUtils.createElement('iframe', {
      src: url,
      id: 'capture-iframe'
    }, doc.body);
  }

  addCaptureScript(doc, url, waitTime) {
    const script = window.WebpageEditor.DOMUtils.createElement('script', {
      textContent: `
        const iframe = document.getElementById('capture-iframe');
        const captureBtn = document.getElementById('capture-btn');
        const waitBtn = document.getElementById('wait-btn');
        const loadingMessage = document.getElementById('loading-message');
        const errorMessage = document.getElementById('error-msg');
        const successMessage = document.getElementById('success-msg');
        const waitTime = ${waitTime || 2};
        
        function showError(message) {
          errorMessage.textContent = message;
          errorMessage.style.display = 'block';
          setTimeout(() => { errorMessage.style.display = 'none'; }, 5000);
        }
        
        function showSuccess(message) {
          successMessage.textContent = message;
          successMessage.style.display = 'block';
          setTimeout(() => { successMessage.style.display = 'none'; }, 3000);
        }
        
        iframe.addEventListener('load', () => {
          loadingMessage.style.display = 'none';
        });
        
        iframe.addEventListener('error', () => {
          loadingMessage.style.display = 'none';
          showError('Failed to load the webpage. Please check the URL and try again.');
        });
        
        captureBtn.addEventListener('click', () => {
          capturePageContent();
        });
        
        waitBtn.addEventListener('click', () => {
          waitBtn.disabled = true;
          waitBtn.textContent = 'Waiting (' + waitTime + 's)...';
          setTimeout(() => {
            capturePageContent();
            waitBtn.disabled = false;
            waitBtn.textContent = 'Wait + Capture';
          }, waitTime * 1000);
        });
        
        function capturePageContent() {
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            
            if (!iframeDoc) {
              throw new Error('Cannot access iframe content due to cross-origin restrictions.');
            }
            
            const doctype = getDocTypeString(iframeDoc);
            const htmlContent = doctype + '\\n' + iframeDoc.documentElement.outerHTML;
            
            createEditablePage(htmlContent);
            showSuccess('✅ Editable copy created successfully!');
            
          } catch (error) {
            if (error.message.includes('cross-origin') || error.message.includes('Blocked a frame')) {
              showError('⚠️ Cross-origin restriction detected! This site cannot be captured using Interactive mode. Please try "Static Capture" or "Dynamic Capture" instead.');
            } else {
              showError('Error capturing page: ' + error.message);
            }
            console.error('Capture error:', error);
          }
        }
        
        function getDocTypeString(doc) {
          const doctype = doc.doctype;
          return doctype ? 
            '<!DOCTYPE ' + doctype.name + 
            (doctype.publicId ? ' PUBLIC "' + doctype.publicId + '"' : '') +
            (doctype.systemId ? ' "' + doctype.systemId + '"' : '') + '>' : 
            '<!DOCTYPE html>';
        }
        
        function createEditablePage(htmlContent) {
          // Use the parent window's VisualEditor class
          try {
            window.opener.WebpageEditor.VisualEditor.openEditor('${url}', htmlContent, 'iframe', ${waitTime});
            showSuccess('✅ Editable copy created successfully!');
          } catch (error) {
            showError('Failed to create editable copy: ' + error.message);
          }
        }
      `
    }, doc.head);
  }

  close() {
    if (this.captureWindow && !this.captureWindow.closed) {
      this.captureWindow.close();
    }
    this.captureWindow = null;
  }

  isOpen() {
    return this.captureWindow && !this.captureWindow.closed;
  }
};

// Main Application class
window.WebpageEditor.App = class {
  constructor() {
    console.log('Starting app initialization...');
    
    // Check if DOM classes exist
    if (!window.WebpageEditor.DOMElements) {
      throw new Error('DOMElements class not found. Make sure dom-utils.js is loaded.');
    }
    
    if (!window.WebpageEditor.UIManager) {
      throw new Error('UIManager class not found. Make sure dom-utils.js is loaded.');
    }
    
    if (!window.WebpageEditor.NetworkManager) {
      throw new Error('NetworkManager class not found. Make sure network.js is loaded.');
    }
    
    this.elements = new window.WebpageEditor.DOMElements();
    this.ui = new window.WebpageEditor.UIManager(this.elements);
    this.network = new window.WebpageEditor.NetworkManager();
    this.iframeCapture = new window.WebpageEditor.IframeCapture();
    
    console.log('App components created successfully');
    this.init();
  }

  init() {
    console.log('Initializing app...');
    
    if (!this.elements.validate()) {
      console.error('Required DOM elements not found');
      console.log('Available elements:', this.elements);
      throw new Error('Required DOM elements not found. Check that your HTML has the correct element IDs.');
    }

    console.log('DOM elements validated successfully');

    this.setupEventListeners();
    this.ui.initAdvancedOptions();
    
    // Add emergency reset to global scope for debugging
    window.resetLoadingState = () => this.ui.resetLoadingState();
    
    // Safe check for DEBUG
    const debugEnabled = window.WebpageEditor.DEBUG?.ENABLED || false;
    if (debugEnabled) {
      console.log('Version Control initialized');
      window.editorApp = this;
    }
    
    console.log('App initialization completed successfully');
  }

  setupEventListeners() {
    console.log('Setting up event listeners...');
    
    this.elements.fetchButton.addEventListener('click', () => this.handleFetch());
    
    this.elements.urlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleFetch();
      }
    });
    
    if (this.elements.advancedOptionsToggle) {
      this.elements.advancedOptionsToggle.addEventListener('click', () => {
        this.ui.toggleAdvancedOptions();
      });
    }

    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
    
    console.log('Event listeners set up successfully');
  }

  async handleFetch() {
    try {
      const url = this.ui.getUrl();
      if (!this.ui.validateUrl(url)) {
        return;
      }
      
      const captureType = this.ui.getCaptureType();
      const waitTime = this.ui.getWaitTime();
      
      this.ui.hideError();
      
      const debugEnabled = window.WebpageEditor.DEBUG?.ENABLED || false;
      if (debugEnabled) {
        console.log('Fetch requested:', { url, captureType, waitTime });
      }
      
      await this.routeCapture(url, captureType, waitTime);
      
    } catch (error) {
      console.error('Error in handleFetch:', error);
      this.ui.showError(`Error: ${error.message}`);
    } finally {
      this.ui.setLoading(false);
    }
  }

  async routeCapture(url, captureType, waitTime) {
    // Use defaults if CONFIG is not loaded
    const captureTypes = window.WebpageEditor.CONFIG?.CAPTURE_TYPES || {
      IFRAME: 'iframe',
      STATIC: 'static',
      DYNAMIC: 'dynamic'
    };
    
    switch (captureType) {
      case captureTypes.IFRAME:
        await this.handleIframeCapture(url, waitTime);
        break;
      
      case captureTypes.STATIC:
      case captureTypes.DYNAMIC:
        await this.handleProxyCapture(url, captureType, waitTime);
        break;
      
      default:
        throw new Error(`Unknown capture type: ${captureType}`);
    }
  }

  async handleIframeCapture(url, waitTime) {
    try {
      const debugEnabled = window.WebpageEditor.DEBUG?.ENABLED || false;
      if (debugEnabled) {
        console.log('Using iframe capture method');
      }
      
      this.iframeCapture.open(url, waitTime);
      
    } catch (error) {
      this.ui.showError(`Error opening capture tool: ${error.message}`);
      throw error;
    }
  }

  async handleProxyCapture(url, captureType, waitTime) {
    this.ui.setLoading(true);
    
    try {
      const debugEnabled = window.WebpageEditor.DEBUG?.ENABLED || false;
      if (debugEnabled) {
        console.log(`Using ${captureType} proxy capture method`);
      }
      
      const htmlContent = await this.network.fetchWithProxies(url);
      
      if (!htmlContent) {
        throw new Error('Failed to fetch the webpage content through any available proxy.');
      }
      
      window.WebpageEditor.VisualEditor.openEditor(url, htmlContent, captureType, waitTime);
      
    } catch (error) {
      this.ui.showError(`Error: ${error.message}`);
      throw error;
    }
  }

  cleanup() {
    if (this.iframeCapture) {
      this.iframeCapture.close();
    }
  }

  getStats() {
    return {
      proxyStats: this.network.getProxyStats(),
      iframeCaptureOpen: this.iframeCapture.isOpen(),
      currentLoadingState: this.ui.isLoading
    };
  }

  reset() {
    this.ui.setLoading(false);
    this.ui.hideError();
    this.cleanup();
    
    const debugEnabled = window.WebpageEditor.DEBUG?.ENABLED || false;
    if (debugEnabled) {
      console.log('Application state reset');
    }
  }
};

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, starting application...');
  
  // Check if required dependencies are available
  const dependencies = [
    'window.WebpageEditor.DOMElements',
    'window.WebpageEditor.UIManager', 
    'window.WebpageEditor.NetworkManager',
    'window.WebpageEditor.DOMUtils'
  ];
  
  const missing = [];
  dependencies.forEach(dep => {
    const parts = dep.split('.');
    let current = window;
    for (const part of parts) {
      if (!current[part]) {
        missing.push(dep);
        break;
      }
      current = current[part];
    }
  });
  
  if (missing.length > 0) {
    console.error('Missing dependencies:', missing);
    const errorMsg = document.getElementById('error-msg');
    if (errorMsg) {
      errorMsg.textContent = `Missing dependencies: ${missing.join(', ')}. Make sure all script files are loaded correctly.`;
      errorMsg.style.display = 'block';
    }
    return;
  }
  
  try {
    const app = new window.WebpageEditor.App();
    window.webpageEditor = app;
    
    const debugEnabled = window.WebpageEditor.DEBUG?.ENABLED || false;
    if (debugEnabled) {
      console.log('Application started successfully');
      console.log('Debug mode enabled - app available as window.webpageEditor');
    }
    
  } catch (error) {
    console.error('Failed to start application:', error);
    
    const errorMsg = document.getElementById('error-msg');
    if (errorMsg) {
      errorMsg.textContent = `Failed to initialize application: ${error.message}`;
      errorMsg.style.display = 'block';
    }
  }
});

// Error handling for unhandled errors
window.addEventListener('error', (event) => {
  console.error('Unhandled error:', event.error);
  
  if (window.webpageEditor) {
    window.webpageEditor.ui.setLoading(false);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  if (window.webpageEditor) {
    window.webpageEditor.ui.setLoading(false);
  }
});