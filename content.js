// content.js
(function() {
  if (document.getElementById('lumina-ai-widget-container')) return;

  // Container
  const container = document.createElement('div');
  container.id = 'lumina-ai-widget-container';
  
  function applyOpacity(opacity) {
    const panel = document.getElementById('lumina-ai-chat-panel');
    if (panel) panel.style.backgroundColor = `rgba(24, 24, 27, ${opacity / 100})`;
  }

  chrome.storage.local.get({ panelOpacity: '90' }, (items) => {
    setTimeout(() => applyOpacity(items.panelOpacity), 100);
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.panelOpacity) applyOpacity(changes.panelOpacity.newValue);
  });

  container.innerHTML = `
    <div id="lumina-selection-tooltip">
      <button class="lumina-tooltip-btn" id="lumina-tt-summarize">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        Özetle
      </button>
      <button class="lumina-tooltip-btn" id="lumina-tt-explain">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        Açıkla
      </button>
    </div>

    <div id="lumina-ai-chat-panel">
      <div id="lumina-ai-resize-handle"></div>
      
      <div class="lumina-header">
        <div class="lumina-brand">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h2z"></path><path d="M12 18a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h2z"></path><path d="M4 10a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h2z"></path><path d="M20 10a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h2z"></path></svg>
          Lumina AI
        </div>
        <div class="lumina-actions">
          <button class="lumina-icon-btn" id="lumina-btn-summarize-page-header" title="Tüm Sayfayı Özetle">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
          </button>
          <button class="lumina-icon-btn" id="lumina-btn-clear" title="Sohbeti Temizle">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
          <button class="lumina-icon-btn" id="lumina-btn-settings" title="Ayarlar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1V11a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V13a1.65 1.65 0 0 0 1 1.51V15a2 2 0 0 1 2 2 2 2 0 0 1 2-2v.09a1.65 1.65 0 0 0 1-1.51 1.65 1.65 0 0 0 1.82.33l.06.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V15a1.65 1.65 0 0 0 1-1.51z"></path></svg>
          </button>
          <button class="lumina-icon-btn" id="lumina-btn-close" title="Kapat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>
      
      <div class="lumina-chat-area" id="lumina-chat-history">
        <div class="lumina-welcome" id="lumina-welcome-screen">
          <h2>Nasıl yardımcı olabilirim?</h2>
          <p>Seçtiğiniz metinleri özetleyebilir, sayfanın tamamını analiz edebilir veya sorularınızı yanıtlayabilirim.</p>
          <div class="lumina-quick-prompts">
            <button class="lumina-quick-prompt" data-prompt="Bu sayfayı kısaca özetle">📄 Sayfayı Özetle</button>
            <button class="lumina-quick-prompt" data-prompt="Bu sayfanın ana fikri nedir?">💡 Ana Fikir</button>
            <button class="lumina-quick-prompt" data-prompt="Bunu 5 yaşındaki birine anlatır gibi açıkla">🧸 Basitçe Açıkla</button>
          </div>
        </div>
      </div>
      
      <div class="lumina-input-container">
        <div class="lumina-input-box">
          <div class="lumina-context-chip-wrapper" id="lumina-context-wrapper">
            <div class="lumina-context-chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              <span class="lumina-context-chip-text" id="lumina-context-text"></span>
              <div class="lumina-context-chip-close" id="lumina-context-clear">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </div>
            </div>
          </div>
          <div class="lumina-input-row">
            <textarea id="lumina-ai-input" placeholder="Yapay zekaya sorun..." rows="1"></textarea>
            <button class="lumina-send-btn" id="lumina-ai-send">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  const panel = document.getElementById('lumina-ai-chat-panel');
  const resizeHandle = document.getElementById('lumina-ai-resize-handle');
  const chatHistory = document.getElementById('lumina-chat-history');
  const welcomeScreen = document.getElementById('lumina-welcome-screen');
  const input = document.getElementById('lumina-ai-input');
  const sendBtn = document.getElementById('lumina-ai-send');
  const contextWrapper = document.getElementById('lumina-context-wrapper');
  const contextText = document.getElementById('lumina-context-text');
  const contextClear = document.getElementById('lumina-context-clear');
  const tooltip = document.getElementById('lumina-selection-tooltip');

  let activeContext = null;
  let streamPort = chrome.runtime.connect({ name: "lumina-stream" });

  function parseMarkdown(text) {
    if (!text) return "";
    
    // Convert headers
    let html = text.replace(/^### (.*$)/gim, '<h3>$1</h3>')
                   .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                   .replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Convert bold and italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
               .replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Convert code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Convert inline code
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');

    // Convert lists (improved)
    html = html.replace(/^\s*[\-\*]\s+(.*)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    html = html.replace(/<\/ul>\s*<ul>/g, '');

    // Convert paragraphs
    html = html.split('\n\n').map(p => {
      if (p.trim().startsWith('<') && !p.trim().startsWith('<em>') && !p.trim().startsWith('<strong>')) return p;
      return `<p>${p.trim().replace(/\n/g, '<br>')}</p>`;
    }).join('');

    return html;
  }

  function appendMessage(text, isUser = false) {
    if (welcomeScreen && welcomeScreen.parentNode) welcomeScreen.remove();
    const msgDiv = document.createElement('div');
    msgDiv.className = `lumina-message ${isUser ? 'lumina-user' : 'lumina-ai'}`;
    const bubble = document.createElement('div');
    bubble.className = 'lumina-bubble';
    bubble.innerHTML = isUser ? text : parseMarkdown(text);
    msgDiv.appendChild(bubble);
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    return bubble;
  }

  async function sendMessage(text) {
    const query = text.trim() || "Açıkla.";
    appendMessage(query, true);
    
    const cType = activeContext ? activeContext.type : 'general';
    const cData = activeContext ? activeContext.data : '';
    
    input.value = '';
    input.style.height = 'auto';
    clearContext();
    
    const aiBubble = appendMessage("", false);
    let fullReply = "";

    streamPort.postMessage({ type: 'PROCESS_QUERY', payload: { query, contextType: cType, contextData: cData } });

    const messageHandler = (msg) => {
      if (msg.type === 'chunk') {
        fullReply += msg.payload;
        aiBubble.innerHTML = parseMarkdown(fullReply);
        chatHistory.scrollTop = chatHistory.scrollHeight;
      } else if (msg.type === 'done') {
        streamPort.onMessage.removeListener(messageHandler);
      } else if (msg.type === 'error') {
        aiBubble.innerHTML = `<span style="color: #ef4444">${msg.payload}</span>`;
        streamPort.onMessage.removeListener(messageHandler);
      }
    };
    streamPort.onMessage.addListener(messageHandler);
  }

  function setContext(type, data) {
    activeContext = { type, data };
    contextWrapper.classList.add('active');
    contextText.textContent = data;
    sendBtn.classList.add('active');
  }

  function clearContext() {
    activeContext = null;
    contextWrapper.classList.remove('active');
    if (!input.value.trim()) sendBtn.classList.remove('active');
  }

  contextClear.addEventListener('click', clearContext);

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = input.scrollHeight + 'px';
    if (input.value.trim() || activeContext) sendBtn.classList.add('active');
    else sendBtn.classList.remove('active');
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input.value);
    }
  });

  sendBtn.addEventListener('click', () => sendMessage(input.value));

  document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    if (panel.contains(selection.anchorNode) || text.length <= 5) {
      tooltip.classList.remove('active');
      return;
    }
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    tooltip.style.top = `${rect.top + window.scrollY - 45}px`;
    tooltip.style.left = `${rect.left + window.scrollX + (rect.width / 2) - 60}px`;
    tooltip.classList.add('active');
  });

  document.getElementById('lumina-tt-summarize').addEventListener('click', () => {
    const text = window.getSelection().toString().trim();
    panel.classList.add('lumina-active');
    setContext('selection', text);
    sendMessage("Bu metni özetle.");
  });

  document.getElementById('lumina-tt-explain').addEventListener('click', () => {
    const text = window.getSelection().toString().trim();
    panel.classList.add('lumina-active');
    setContext('selection', text);
    sendMessage("Bunu açıkla.");
  });

  document.querySelectorAll('.lumina-quick-prompt').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const p = e.target.getAttribute('data-prompt');
      if (p.includes('sayfa')) setContext('page', document.body.innerText.substring(0, 15000));
      sendMessage(p);
    });
  });

  document.getElementById('lumina-btn-summarize-page-header').addEventListener('click', () => {
    setContext('page', document.body.innerText.substring(0, 15000));
    sendMessage("Bu sayfayı özetle.");
  });

  document.getElementById('lumina-btn-clear').addEventListener('click', () => {
    chatHistory.innerHTML = '';
    chatHistory.appendChild(welcomeScreen);
    clearContext();
  });

  document.getElementById('lumina-btn-close').addEventListener('click', () => panel.classList.remove('lumina-active'));
  document.getElementById('lumina-btn-settings').addEventListener('click', () => chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' }));

  chrome.runtime.onMessage.addListener((request) => {
    if (request.type === 'TOGGLE_SIDE_PANEL') {
      panel.classList.toggle('lumina-active');
      if (panel.classList.contains('lumina-active')) input.focus();
    } else if (request.type === 'OPEN_AND_SUMMARIZE_SELECTION') {
      panel.classList.add('lumina-active');
      setContext('selection', request.payload);
      sendMessage("Bu metni özetle.");
    }
  });

  let isResizing = false, startX, startWidth;
  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true; startX = e.clientX; startWidth = parseInt(getComputedStyle(panel).width);
    document.body.style.cursor = 'ew-resize'; panel.style.transition = 'none';
  });
  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const w = startWidth + (startX - e.clientX);
    if (w > 320 && w < window.innerWidth * 0.8) panel.style.width = w + 'px';
  });
  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false; document.body.style.cursor = 'default';
      panel.style.transition = 'right 0.4s cubic-bezier(0.16, 1, 0.3, 1), width 0.1s ease';
    }
  });
})();
