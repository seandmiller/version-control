// Configuration and Constants for Version Control
// Global namespace approach for file:// compatibility

window.WebpageEditor = window.WebpageEditor || {};

window.WebpageEditor.CONFIG = {
  // Proxy services for CORS bypass - Updated with named functions
  CORS_PROXIES: [
    Object.assign(
      (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      { name: 'AllOrigins' }
    ),
    Object.assign(
      (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
      { name: 'CORS Proxy IO' }
    ),
    Object.assign(
      (url) => `https://cors-anywhere.herokuapp.com/${url}`,
      { name: 'CORS Anywhere' }
    ),
    Object.assign(
      (url) => `https://cors.bridged.cc/${url}`,
      { name: 'Bridged CORS' }
    )
  ],

  // Default wait times
  DEFAULT_WAIT_TIME: 2,
  MAX_WAIT_TIME: 30,

  // Capture types
  CAPTURE_TYPES: {
    STATIC: 'static',
    DYNAMIC: 'dynamic', 
    IFRAME: 'iframe'
  },

  // Editor styles
  EDITOR_STYLES: {
    TOOLBAR_COLOR: '#4a90e2',
    HOVER_COLOR: 'rgba(74, 144, 226, 0.1)',
    FOCUS_COLOR: 'rgba(74, 144, 226, 0.15)',
    TOOLBAR_HEIGHT: '50px'
  },

  // CSS properties to skip during style inlining
  SKIP_CSS_PROPERTIES: [
    'animation', 
    'animation-', 
    'transition', 
    'transition-',
    '-webkit-animation', 
    '-webkit-transition',
    'cursor'
  ],

  // HTML attributes to fix for URLs
  URL_ATTRIBUTES: {
    img: 'src',
    script: 'src',
    link: 'href',
    a: 'href',
    video: 'src',
    audio: 'src',
    source: 'src',
    iframe: 'src',
    embed: 'src',
    object: 'data',
    form: 'action'
  },

  // Elements that typically contain editable text
  EDITABLE_SELECTORS: [
    'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
    'span', 'div', 'a', 'li', 'td', 'th', 
    'strong', 'em', 'label', 'button', 'figcaption'
  ],

  // Default filenames
  DEFAULT_FILENAME: 'edited-page.html',

  // User agent for proxy requests
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

// Error messages
window.WebpageEditor.MESSAGES = {
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

// Debug mode
window.WebpageEditor.DEBUG = {
  ENABLED: false,
  LOG_PROXY_ATTEMPTS: true,
  LOG_DOM_OPERATIONS: false,
  LOG_CAPTURE_OPERATIONS: true
};