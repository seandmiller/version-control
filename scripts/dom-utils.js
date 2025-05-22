// DOM Manipulation and UI Utilities
// Global namespace approach - NO IMPORTS

window.WebpageEditor = window.WebpageEditor || {};

// Ensure MESSAGES exists with defaults
window.WebpageEditor.MESSAGES = window.WebpageEditor.MESSAGES || {
  ERRORS: {
    NO_URL: 'Please enter a valid URL',
    INVALID_URL: 'URL must start with http:// or https://',
    POPUP_BLOCKED: 'Could not open a new tab. Please check your popup blocker settings.',
    PARSE_ERROR: 'Could not parse the webpage HTML',
    PROXY_FAILED: 'Failed to fetch the webpage content through any available proxy.',
    CROSS_ORIGIN: '⚠️ Cross-origin restriction detected! This site cannot be captured using Interactive mode. Please try "Static Capture" or "Dynamic Capture" instead.',
    IFRAME_ACCESS: 'Cannot access iframe content due to cross-origin restrictions.',
    SAVE_FAILED: 'Failed to save the page.',
    CAPTURE_FAILED: 'Error capturing page:'
  },
  
  INFO: {
    LOADING: 'Creating editable version...',
    BUTTON_LOADING: 'Loading...',
    BUTTON_DEFAULT: 'Create Editable Version',
    EDIT_TOOLTIP: 'Click to edit',
    SCRIPTS_ENABLED: 'Scripts Enabled',
    SAVE_PROMPT: 'Enter filename to save as:',
    SCRIPTS_WARNING: 'Enabling scripts may cause the page to change or navigate away. Continue?'
  }
};

// DOM element references
window.WebpageEditor.DOMElements = class {
  constructor() {
    this.urlInput = document.getElementById('url');
    this.fetchButton = document.getElementById('fetch-btn');
    this.errorMsg = document.getElementById('error-msg');
    this.advancedOptionsToggle = document.getElementById('advanced-options-toggle');
    this.advancedOptionsPanel = document.getElementById('advanced-options-panel');
    this.captureTypeRadios = document.getElementsByName('capture-type');
    this.waitTimeInput = document.getElementById('wait-time');
    this.loadingOverlay = document.getElementById('loading-overlay');
    this.loadingText = document.getElementById('loading-text');
  }

  validate() {
    const required = ['urlInput', 'fetchButton'];
    const missing = required.filter(elem => !this[elem]);
    
    if (missing.length > 0) {
      console.warn('Missing required DOM elements:', missing);
      return false;
    }
    return true;
  }
};

// UI state management
window.WebpageEditor.UIManager = class {
  constructor(elements) {
    this.elements = elements;
    this.isLoading = false;
  }

  showError(message) {
    if (this.elements.errorMsg) {
      this.elements.errorMsg.textContent = message;
      this.elements.errorMsg.style.display = 'block';
    }
    if (window.WebpageEditor.DEBUG?.ENABLED) {
      console.error('UI Error:', message);
    }
  }

  hideError() {
    if (this.elements.errorMsg) {
      this.elements.errorMsg.textContent = '';
      this.elements.errorMsg.style.display = 'none';
    }
  }

  setLoading(loading) {
    this.isLoading = loading;
    
    // Get messages with fallbacks
    const messages = window.WebpageEditor.MESSAGES?.INFO || {
      LOADING: 'Creating editable version...',
      BUTTON_LOADING: 'Loading...',
      BUTTON_DEFAULT: 'Create Editable Version'
    };
    
    if (loading) {
      if (this.elements.loadingOverlay) {
        this.elements.loadingOverlay.style.display = 'flex';
      }
      if (this.elements.loadingText) {
        this.elements.loadingText.textContent = messages.LOADING;
      }
      if (this.elements.fetchButton) {
        this.elements.fetchButton.textContent = messages.BUTTON_LOADING;
        this.elements.fetchButton.disabled = true;
      }
    } else {
      if (this.elements.loadingOverlay) {
        this.elements.loadingOverlay.style.display = 'none';
      }
      if (this.elements.fetchButton) {
        this.elements.fetchButton.textContent = messages.BUTTON_DEFAULT;
        this.elements.fetchButton.disabled = false;
      }
    }
  }

  resetLoadingState() {
    console.log('Resetting loading state...');
    this.setLoading(false);
  }

  getCaptureType() {
    if (!this.elements.captureTypeRadios) {
      return 'static';
    }
    for (const radio of this.elements.captureTypeRadios) {
      if (radio.checked) {
        return radio.value;
      }
    }
    return 'static';
  }

  getWaitTime() {
    if (!this.elements.waitTimeInput) {
      return 0;
    }
    return parseInt(this.elements.waitTimeInput.value) || 0;
  }

  getUrl() {
    if (!this.elements.urlInput) {
      return '';
    }
    return this.elements.urlInput.value.trim();
  }

  validateUrl(url) {
    // Get error messages with fallbacks
    const errors = window.WebpageEditor.MESSAGES?.ERRORS || {
      NO_URL: 'Please enter a valid URL',
      INVALID_URL: 'URL must start with http:// or https://'
    };
    
    if (!url) {
      this.showError(errors.NO_URL);
      return false;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      this.showError(errors.INVALID_URL);
      return false;
    }
    
    return true;
  }

  toggleAdvancedOptions() {
    if (!this.elements.advancedOptionsToggle || !this.elements.advancedOptionsPanel) {
      return;
    }

    const panel = this.elements.advancedOptionsPanel;
    const toggle = this.elements.advancedOptionsToggle;

    if (panel.style.display === 'none' || !panel.style.display) {
      panel.style.display = 'block';
      toggle.textContent = 'Hide Advanced Options';
    } else {
      panel.style.display = 'none';
      toggle.textContent = 'Show Advanced Options';
    }
  }

  initAdvancedOptions() {
    if (this.elements.advancedOptionsPanel) {
      this.elements.advancedOptionsPanel.style.display = 'none';
    }
  }
};

// Utility functions for DOM operations
window.WebpageEditor.DOMUtils = {
  createWindow(url = 'about:blank', target = '_blank', features = '') {
    try {
      const newWindow = window.open(url, target, features);
      if (!newWindow) {
        const errorMsg = window.WebpageEditor.MESSAGES?.ERRORS?.POPUP_BLOCKED || 
                        'Could not open a new tab. Please check your popup blocker settings.';
        throw new Error(errorMsg);
      }
      return newWindow;
    } catch (error) {
      const errorMsg = window.WebpageEditor.MESSAGES?.ERRORS?.POPUP_BLOCKED || 
                      'Could not open a new tab. Please check your popup blocker settings.';
      throw new Error(`${errorMsg}: ${error.message}`);
    }
  },

  writeToDocument(doc, html) {
    try {
      doc.open();
      doc.write(html);
      doc.close();
    } catch (error) {
      throw new Error(`Failed to write to document: ${error.message}`);
    }
  },

  createElement(tag, attributes = {}, parent = null) {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'textContent' || key === 'innerHTML') {
        element[key] = value;
      } else {
        element.setAttribute(key, value);
      }
    });

    if (parent) {
      parent.appendChild(element);
    }

    return element;
  }
};