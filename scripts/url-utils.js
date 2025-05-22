// URL and CSS Fixing Utilities
// Global namespace approach - NO IMPORTS

window.WebpageEditor = window.WebpageEditor || {};

window.WebpageEditor.URLUtils = {
  parseURL(url) {
    try {
      const urlObj = new URL(url);
      return {
        protocol: urlObj.protocol,
        host: urlObj.host,
        origin: urlObj.origin,
        basePath: url.substring(0, url.lastIndexOf('/') + 1),
        baseUrl: `${urlObj.protocol}//${urlObj.host}`
      };
    } catch (error) {
      throw new Error(`Invalid URL: ${url}`);
    }
  },

  isAbsoluteURL(url) {
    return url.startsWith('http://') || 
           url.startsWith('https://') || 
           url.startsWith('data:') || 
           url.startsWith('#') ||
           url.startsWith('javascript:');
  },

  makeAbsolute(relativeUrl, baseUrl, basePath) {
    if (this.isAbsoluteURL(relativeUrl)) {
      return relativeUrl;
    }

    const { origin } = this.parseURL(baseUrl);

    if (relativeUrl.startsWith('/')) {
      return origin + relativeUrl;
    } else {
      return basePath + relativeUrl;
    }
  },

  fixRelativeUrls(doc, baseUrl, basePath) {
    const { origin } = this.parseURL(baseUrl);
    
    Object.entries(window.WebpageEditor.CONFIG.URL_ATTRIBUTES).forEach(([tagName, attrName]) => {
      const elements = doc.querySelectorAll(tagName);
      
      elements.forEach(element => {
        const attrValue = element.getAttribute(attrName);
        
        if (attrValue && !this.isAbsoluteURL(attrValue)) {
          const absoluteUrl = this.makeAbsolute(attrValue, baseUrl, basePath);
          element.setAttribute(attrName, absoluteUrl);
        }
      });
    });
    
    window.WebpageEditor.CSSUtils.fixCssUrls(doc, basePath);
  }
};

window.WebpageEditor.CSSUtils = {
  fixCssUrls(doc, basePath) {
    const styleElements = doc.querySelectorAll('style');
    styleElements.forEach(style => {
      if (style.textContent) {
        style.textContent = this.fixCssUrlsInText(style.textContent, basePath);
      }
    });
    
    const elementsWithStyle = doc.querySelectorAll('[style]');
    elementsWithStyle.forEach(element => {
      const styleAttr = element.getAttribute('style');
      if (styleAttr) {
        element.setAttribute('style', this.fixCssUrlsInText(styleAttr, basePath));
      }
    });
  },

  fixCssUrlsInText(cssText, basePath) {
    return cssText.replace(/url\(['"]?([^'")\s]+)['"]?\)/g, (match, url) => {
      if (window.WebpageEditor.URLUtils.isAbsoluteURL(url)) {
        return match;
      }
      
      if (url.startsWith('/')) {
        return match;
      } else {
        const absoluteUrl = basePath + url;
        return `url('${absoluteUrl}')`;
      }
    });
  }
};

window.WebpageEditor.DocumentUtils = {
  createBaseTag(basePath) {
    const baseTag = document.createElement('base');
    baseTag.href = basePath;
    return baseTag;
  },

  getDoctype(doc) {
    const doctype = doc.doctype;
    if (!doctype) return '<!DOCTYPE html>';
    
    return '<!DOCTYPE ' + 
      doctype.name + 
      (doctype.publicId ? ' PUBLIC "' + doctype.publicId + '"' : '') +
      (doctype.systemId ? ' "' + doctype.systemId + '"' : '') + '>';
  },

  prepareHTML(htmlContent, sourceUrl) {
    const parser = new DOMParser();
    let doc;
    
    try {
      doc = parser.parseFromString(htmlContent, 'text/html');
    } catch (error) {
      throw new Error(`Could not parse HTML: ${error.message}`);
    }
    
    const { baseUrl, basePath } = window.WebpageEditor.URLUtils.parseURL(sourceUrl);
    
    window.WebpageEditor.URLUtils.fixRelativeUrls(doc, baseUrl, basePath);
    
    const baseTag = this.createBaseTag(basePath);
    if (doc.head && !doc.head.querySelector('base')) {
      doc.head.insertBefore(baseTag, doc.head.firstChild);
    }
    
    return {
      doc,
      headContent: doc.head.innerHTML,
      bodyContent: doc.body.innerHTML,
      basePath
    };
  }
};