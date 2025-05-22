// Network Operations and Proxy Handling
// Global namespace approach - NO IMPORTS

window.WebpageEditor = window.WebpageEditor || {};

// Ensure CONFIG exists with defaults
window.WebpageEditor.CONFIG = window.WebpageEditor.CONFIG || {
  CORS_PROXIES: [
    function allOrigins(url) { return `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`; },
    function corsProxyIO(url) { return `https://corsproxy.io/?${encodeURIComponent(url)}`; },
    function corsAnywhere(url) { return `https://cors-anywhere.herokuapp.com/${url}`; },
    function bridgedCors(url) { return `https://cors.bridged.cc/${url}`; }
  ].map(fn => { fn.displayName = fn.name; return fn; }),
  DEFAULT_WAIT_TIME: 2,
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

// Ensure MESSAGES exists with defaults
window.WebpageEditor.MESSAGES = window.WebpageEditor.MESSAGES || {
  ERRORS: {
    PROXY_FAILED: 'Failed to fetch the webpage content through any available proxy.'
  }
};

// Ensure DEBUG exists with defaults
window.WebpageEditor.DEBUG = window.WebpageEditor.DEBUG || {
  ENABLED: false,
  LOG_PROXY_ATTEMPTS: true
};

window.WebpageEditor.NetworkManager = class {
  constructor() {
    this.proxyAttempts = new Map();
    this.successfulProxies = new Set();
    this.failedProxies = new Set();
  }

  async fetchWithProxies(url) {
    let html = null;
    let lastError = null;
    
    // Get proxies with fallback
    const proxies = window.WebpageEditor.CONFIG?.CORS_PROXIES || window.WebpageEditor.CONFIG.CORS_PROXIES;
    
    for (const proxyGenerator of proxies) {
      if (html) break;
      
      let proxyUrl; // Move declaration outside try block
      
      try {
        proxyUrl = proxyGenerator(url);
        
        if (window.WebpageEditor.DEBUG?.LOG_PROXY_ATTEMPTS) {
          console.log(`Trying proxy: ${proxyGenerator.displayName || proxyGenerator.name || 'Unknown'} -> ${proxyUrl}`);
        }
        
        this.recordProxyAttempt(proxyGenerator.displayName || proxyGenerator.name || proxyUrl, 'attempt');
        
        const response = await this.fetchWithTimeout(proxyUrl, {
          headers: this.getDefaultHeaders(),
          timeout: 30000
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        html = await response.text();
        
        // Validate that we got actual HTML content
        if (!html || html.trim().length === 0) {
          throw new Error('Empty response received');
        }
        
        this.recordProxyAttempt(proxyGenerator.displayName || proxyGenerator.name || proxyUrl, 'success');
        this.successfulProxies.add(proxyGenerator);
        
        if (window.WebpageEditor.DEBUG?.LOG_PROXY_ATTEMPTS) {
          console.log(`Successfully fetched content via ${proxyGenerator.displayName || proxyGenerator.name || 'proxy'}`);
        }
        
      } catch (err) {
        this.recordProxyAttempt(proxyGenerator.displayName || proxyGenerator.name || proxyUrl || 'unknown-proxy', 'failure');
        this.failedProxies.add(proxyGenerator);
        
        if (window.WebpageEditor.DEBUG?.LOG_PROXY_ATTEMPTS) {
          console.error(`Proxy ${proxyGenerator.displayName || proxyGenerator.name || 'Unknown'} error: ${err.message}`);
        }
        
        lastError = err;
      }
    }
    
    if (!html && lastError) {
      const errorMsg = window.WebpageEditor.MESSAGES?.ERRORS?.PROXY_FAILED || 
                      'Failed to fetch the webpage content through any available proxy.';
      throw new Error(`${errorMsg} Last error: ${lastError.message}`);
    }
    
    return html;
  }

  async fetchWithTimeout(url, options = {}) {
    const { timeout = 30000, ...fetchOptions } = options;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
  }

  getDefaultHeaders() {
    const userAgent = window.WebpageEditor.CONFIG?.USER_AGENT || 
                     'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    
    return {
      'User-Agent': userAgent,
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Pragma': 'no-cache',
      'Cache-Control': 'no-cache'
    };
  }

  recordProxyAttempt(proxyId, result) {
    if (!this.proxyAttempts.has(proxyId)) {
      this.proxyAttempts.set(proxyId, {
        attempts: 0,
        successes: 0,
        failures: 0,
        lastUsed: null
      });
    }
    
    const stats = this.proxyAttempts.get(proxyId);
    stats.attempts++;
    stats.lastUsed = new Date();
    
    if (result === 'success') {
      stats.successes++;
    } else if (result === 'failure') {
      stats.failures++;
    }
  }

  getProxyStats() {
    const stats = {};
    for (const [proxyId, data] of this.proxyAttempts) {
      stats[proxyId] = {
        ...data,
        successRate: data.attempts > 0 ? (data.successes / data.attempts) * 100 : 0
      };
    }
    return stats;
  }
};