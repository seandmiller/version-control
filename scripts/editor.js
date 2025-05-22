// DOM Elements
const editor = document.getElementById('editor-textarea');
const previewBtn = document.getElementById('preview-btn');
const saveBtn = document.getElementById('save-btn');
const formatBtn = document.getElementById('format-btn');
const errorMsg = document.getElementById('error-display');
const charCount = document.getElementById('char-count');
const editorMode = document.getElementById('editor-mode');
const pasteInstructions = document.querySelector('.paste-instructions');
const urlDisplay = document.getElementById('url-display');

// State
let isPreview = false;

// Check if URL has source parameter
const urlParams = new URLSearchParams(window.location.search);
const sourceUrl = urlParams.get('source');
if (sourceUrl) {
  urlDisplay.textContent = `Source: ${sourceUrl}`;
}

// Event Listeners
if (pasteInstructions) {
  // Remove instructions when editor gets focus or content
  editor.addEventListener('focus', () => {
    pasteInstructions.style.display = 'none';
  });
  
  editor.addEventListener('input', () => {
    pasteInstructions.style.display = 'none';
    updateCharCount();
  });
} else {
  editor.addEventListener('input', updateCharCount);
}

previewBtn.addEventListener('click', togglePreview);
saveBtn.addEventListener('click', saveToFile);
formatBtn.addEventListener('click', formatHTML);

// Enable keyboard shortcuts
document.addEventListener('keydown', handleKeyboardShortcuts);

// Update character count
function updateCharCount() {
  charCount.textContent = 'Characters: ' + editor.value.length;
}


function togglePreview() {
  if (!editor.value.trim()) {
    showError('Please enter some HTML content first');
    return;
  }
  
  isPreview = !isPreview;
  
  if (isPreview) {
    try {
      const iframe = document.createElement('iframe');
      iframe.id = 'preview-frame';
      iframe.style.width = '100%';
      iframe.style.height = 'calc(100vh - 56px)';
      iframe.style.border = 'none';

      editor.style.display = 'none';
      

      document.querySelector('.editor-container').insertBefore(
        iframe, 
        document.querySelector('.status-bar')
      );
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(editor.value);
      iframeDoc.close();
      
      previewBtn.textContent = 'Edit Mode';
      editorMode.textContent = 'Preview Mode';
      clearError();
    } catch (error) {
      showError('Preview error: ' + error.message);
      isPreview = false;
    }
  } else {
    const iframe = document.getElementById('preview-frame');
    if (iframe) {
      iframe.remove();
    }
    editor.style.display = 'block';
    previewBtn.textContent = 'Preview Mode';
    editorMode.textContent = 'Edit Mode';
  }
}



// Save content to a file
function saveToFile() {
  if (!editor.value.trim()) {
    showError('Please enter some HTML content first');
    return;
  }
  
  try {
    const blob = new Blob([editor.value], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const filename = window.prompt('Enter filename:', 'webpage.html');
    
    if (filename) {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      clearError();
    }
  } catch (error) {
    showError('Save error: ' + error.message);
  }
}

// Handle keyboard shortcuts
function handleKeyboardShortcuts(e) {
  // Ctrl+S or Command+S to save
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveToFile();
  }
  
  // Ctrl+P or Command+P to preview
  if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
    e.preventDefault();
    togglePreview();
  }
  

}


function showError(message) {
  errorMsg.textContent = message;
}

function clearError() {
  errorMsg.textContent = '';
}