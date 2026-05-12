// content.js
(function() {
  const isTopFrame = window.self === window.top;
  if (!isTopFrame) {
    // We are in an iframe. Only listen for content requests.
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'COLLECT_CONTENT') {
        const content = getPageContent();
        sendResponse({ content });
      }
    });
    return;
  }

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
          <button class="lumina-icon-btn active" id="lumina-btn-chat-view" title="Sohbet">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          </button>
          <button class="lumina-icon-btn" id="lumina-btn-history-view" title="Geçmiş Sohbetler">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </button>
          <button class="lumina-icon-btn" id="lumina-btn-notes-view" title="Notlarım">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
          </button>
          <button class="lumina-icon-btn" id="lumina-btn-new-chat" title="Yeni Sohbet">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
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
            <button class="lumina-quick-prompt" data-prompt="Bu sayfayı kısaca özetle" data-context="page">📄 Sayfayı Özetle</button>
            <button class="lumina-quick-prompt" data-prompt="Bu sayfanın ana fikri nedir?" data-context="page">💡 Ana Fikir</button>
            <button class="lumina-quick-prompt" data-prompt="Bunu 5 yaşındaki birine anlatır gibi açıkla" data-context="page">🧸 Basitçe Açıkla</button>
            <button class="lumina-quick-prompt" data-prompt="Bu sayfayı İngilizce'ye çevir" data-context="page">🌐 İngilizce'ye Çevir</button>
          </div>
        </div>
      </div>

      <div class="lumina-history-area" id="lumina-history-list">
        <div class="lumina-notes-header">
          <span class="lumina-notes-title">Sohbet Geçmişi</span>
        </div>
        <div id="lumina-history-container"></div>
      </div>

      <div class="lumina-notes-area" id="lumina-notes-list">
        <div class="lumina-notes-header">
          <span class="lumina-notes-title">Notlarım</span>
          <button class="lumina-add-note-btn" id="lumina-btn-add-note-manual" title="Yeni Not Ekle">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </div>
        <div class="lumina-new-note-box" id="lumina-new-note-ui">
          <textarea class="lumina-new-note-textarea" id="lumina-note-text-input" placeholder="Notunuzu yazın..."></textarea>
          <div class="lumina-new-note-actions">
            <button class="lumina-btn-small lumina-btn-cancel" id="lumina-btn-cancel-note">İptal</button>
            <button class="lumina-btn-small lumina-btn-save" id="lumina-btn-save-manual-note">Kaydet</button>
          </div>
        </div>
        <div id="lumina-notes-container"></div>
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
            <div class="lumina-input-actions">
              <button class="lumina-input-action-btn" id="lumina-btn-paste-clipboard" title="Yapıştır">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
              </button>
              <button class="lumina-input-action-btn" id="lumina-btn-summarize-input" title="Sayfayı Özetle">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
              </button>
              <button class="lumina-send-btn" id="lumina-ai-send">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  // --- Selectors ---
  const panel = document.getElementById('lumina-ai-chat-panel');
  const chatHistory = document.getElementById('lumina-chat-history');
  const welcomeScreen = document.getElementById('lumina-welcome-screen');
  const input = document.getElementById('lumina-ai-input');
  const sendBtn = document.getElementById('lumina-ai-send');
  const contextWrapper = document.getElementById('lumina-context-wrapper');
  const contextText = document.getElementById('lumina-context-text');
  const contextClear = document.getElementById('lumina-context-clear');
  const tooltip = document.getElementById('lumina-selection-tooltip');
  
  const chatViewBtn = document.getElementById('lumina-btn-chat-view');
  const historyViewBtn = document.getElementById('lumina-btn-history-view');
  const notesViewBtn = document.getElementById('lumina-btn-notes-view');
  
  const historyArea = document.getElementById('lumina-history-list');
  const notesArea = document.getElementById('lumina-notes-list');
  const inputContainer = container.querySelector('.lumina-input-container');

  let activeContext = null;
  let streamPort = null;
  let notes = [];
  let chatSessions = [];
  let currentMessages = [];
  let currentSessionId = Date.now();

  // Initialize
  loadNotes();
  loadHistory();

  function getPort() {
    if (!streamPort) {
      streamPort = chrome.runtime.connect({ name: "lumina-stream" });
      streamPort.onDisconnect.addListener(() => { streamPort = null; });
    }
    return streamPort;
  }

  function parseMarkdown(text) {
    if (!text) return "";
    let html = text.replace(/^### (.*$)/gim, '<h3>$1</h3>')
                   .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                   .replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
               .replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    html = html.replace(/^\s*[\-\*]\s+(.*)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    html = html.replace(/<\/ul>\s*<ul>/g, '');
    html = html.split('\n\n').map(p => {
      if (p.trim().startsWith('<') && !p.trim().startsWith('<em>') && !p.trim().startsWith('<strong>')) return p;
      return `<p>${p.trim().replace(/\n/g, '<br>')}</p>`;
    }).join('');
    return html;
  }

  function getPageContent() {
    function isVisible(el) {
      const style = window.getComputedStyle(el);
      return  style.display !== 'none' && 
              style.visibility !== 'hidden' && 
              style.opacity !== '0' &&
              el.offsetWidth > 0 && 
              el.offsetHeight > 0;
    }

    function isFloating(el) {
      const style = window.getComputedStyle(el);
      return ['fixed', 'absolute'].includes(style.position);
    }

    function getElementScore(el) {
      if (!isVisible(el)) return -1000;
      if (isFloating(el)) return -500; // Cookie banners are usually fixed/absolute

      let score = 0;
      const text = (el.innerText || "").trim();
      const wordCount = text.split(/\s+/).length;
      
      if (wordCount < 25) return -100;

      const tagName = el.tagName.toLowerCase();
      if (['article', 'main'].includes(tagName)) score += 60;
      if (['section', 'div'].includes(tagName)) score += 5;

      const idAndClass = (el.id + " " + el.className).toLowerCase();
      const noisyWords = ['nav', 'menu', 'footer', 'header', 'aside', 'sidebar', 'cookie', 'consent', 'çerez', 'banner', 'ad-', 'social', 'share', 'widget', 'popup', 'modal', 'kvkk'];
      noisyWords.forEach(word => {
        if (idAndClass.includes(word)) score -= 40;
      });

      const articleWords = ['content', 'article', 'post', 'body', 'main', 'story', 'entry', 'text', 'haber', 'makale'];
      articleWords.forEach(word => {
        if (idAndClass.includes(word)) score += 25;
      });

      const links = el.querySelectorAll('a');
      let linkTextLength = 0;
      links.forEach(a => linkTextLength += (a.innerText || "").length);
      const density = (text.length - linkTextLength) / Math.max(text.length, 1);
      score += density * 100;
      score += Math.min(wordCount / 4, 150);

      return score;
    }

    // 1. First, try to find a high-scoring container
    const candidates = Array.from(document.querySelectorAll('div, article, main, section'));
    let bestEl = null;
    let maxScore = -Infinity;

    for (const el of candidates) {
      if (el.children.length === 0 && el.innerText.length < 100) continue;
      const score = getElementScore(el);
      if (score > maxScore) {
        maxScore = score;
        bestEl = el;
      }
    }

    let mainText = "";
    if (bestEl && maxScore > 30) {
      const clone = bestEl.cloneNode(true);
      removeIrrelevantElements(clone);
      mainText = clone.innerText || clone.textContent;
    }

    // 2. Fallback: Aggregate all meaningful paragraphs if no single container is dominant
    if (!mainText || mainText.length < 600 || (mainText.toLowerCase().includes('çerez') && mainText.length < 1500)) {
      const allElements = document.querySelectorAll('p, h1, h2, h3, div, span, li');
      const filteredParts = [];
      
      for (const el of allElements) {
        if (el.querySelector('p, div')) continue; // Skip containers to avoid double-counting text

        const text = (el.innerText || "").trim();
        if (text.length < 40 || text.length > 3000) continue; 
        if (isFloating(el)) continue;

        const lowerText = text.toLowerCase();
        const junkWords = ['çerez', 'cookie', 'consent', 'privacy', 'kvkk', 'gizlilik', 'şartlar', 'terms', 'kabul et', 'reddet', 'ayarlar', 'tüm hakları', 'çerezleri', 'cookies'];
        
        if (junkWords.some(word => lowerText.includes(word))) continue;
        
        const links = el.querySelectorAll('a');
        if (links.length > 3 && text.length < 300) continue;

        filteredParts.push(text);
      }
      
      mainText = [...new Set(filteredParts)].join('\n\n');
    }

    function removeIrrelevantElements(root) {
      const tagsToRemove = ['script', 'style', 'noscript', 'iframe', 'svg', 'nav', 'footer', 'header', 'aside', '#lumina-ai-widget-container', 'form', 'button', 'input', 'select', 'img'];
      tagsToRemove.forEach(tag => root.querySelectorAll(tag).forEach(el => el.remove()));

      const noisySelectors = [
        '[class*="cookie"]', '[id*="cookie"]', '[class*="consent"]', '[id*="consent"]',
        '[class*="popup"]', '[id*="popup"]', '[class*="gdpr"]', '[id*="gdpr"]',
        '[class*="çerez"]', '[id*="çerez"]', '.kvkk', '#kvkk', '.privacy',
        '.social-share', '.related-posts', '.comments-section', '#comments',
        '.sidebar', '.navigation', '.menu', '.header', '.footer'
      ];
      noisySelectors.forEach(selector => {
        try { root.querySelectorAll(selector).forEach(el => el.remove()); } catch(e) {}
      });
    }

    return mainText ? mainText.replace(/\s\s+/g, ' ').trim().substring(0, 40000) : "";
  }

  function appendMessage(text, isUser = false, skipStorage = false) {
    if (welcomeScreen && welcomeScreen.parentNode) welcomeScreen.remove();
    const msgDiv = document.createElement('div');
    msgDiv.className = `lumina-message ${isUser ? 'lumina-user' : 'lumina-ai'}`;
    const bubble = document.createElement('div');
    bubble.className = 'lumina-bubble';
    bubble.innerHTML = isUser ? text : parseMarkdown(text);
    msgDiv.appendChild(bubble);

    if (!isUser) {
      const actionsDiv = document.createElement('div');
      actionsDiv.style.display = 'flex';
      actionsDiv.style.gap = '8px';

      const copyBtn = document.createElement('button');
      copyBtn.className = 'lumina-copy-btn';
      copyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(bubble.innerText).then(() => {
          copyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
          setTimeout(() => { copyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`; }, 1500);
        });
      });

      const saveBtn = document.createElement('button');
      saveBtn.className = 'lumina-copy-btn';
      saveBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>`;
      saveBtn.addEventListener('click', () => {
        addNote(bubble.innerText);
        saveBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        setTimeout(() => { saveBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>`; }, 1500);
      });

      actionsDiv.appendChild(copyBtn);
      actionsDiv.appendChild(saveBtn);
      msgDiv.appendChild(actionsDiv);
    }
    
    if (!skipStorage) {
      currentMessages.push({ isUser, text });
      updateCurrentSession();
    }

    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    return bubble;
  }

  // --- Session & History Logic ---
  async function loadHistory() {
    const data = await chrome.storage.local.get({ lumina_sessions: [] });
    chatSessions = data.lumina_sessions;
    renderHistory();
  }

  function renderHistory() {
    const container = document.getElementById('lumina-history-container');
    if (!container) return;
    if (chatSessions.length === 0) {
      container.innerHTML = `<div class="lumina-empty-history"><span>Henüz geçmiş sohbet yok.</span></div>`;
      return;
    }
    container.innerHTML = '';
    chatSessions.slice().reverse().forEach(session => {
      const item = document.createElement('div');
      item.className = 'lumina-history-item';
      item.innerHTML = `
        <div class="lumina-history-title">${session.title || "Yeni Sohbet"}</div>
        <div class="lumina-history-meta">
          <span>${new Date(session.id).toLocaleDateString('tr-TR')}</span>
          <div style="display: flex; gap: 8px; align-items: center;">
            <span>${session.messages.length} mesaj</span>
            <span class="lumina-history-delete" data-id="${session.id}">Sil</span>
          </div>
        </div>
      `;
      
      // Tıklama olayı (item'ın kendisine basınca aç)
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('lumina-history-delete')) return;
        restoreSession(session);
      });

      // Silme olayı
      item.querySelector('.lumina-history-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteSession(session.id);
      });

      container.appendChild(item);
    });
  }

  async function deleteSession(id) {
    chatSessions = chatSessions.filter(s => s.id !== id);
    await chrome.storage.local.set({ lumina_sessions: chatSessions });
    if (currentSessionId === id) startNewChat();
    renderHistory();
  }

  async function updateCurrentSession() {
    if (currentMessages.length === 0) return;
    
    // İlk yapay zeka cevabını bul
    const firstAiMsg = currentMessages.find(m => !m.isUser && m.text.trim() !== "");
    let title = "";
    
    if (firstAiMsg) {
      // Yapay zeka cevabının başını al
      title = firstAiMsg.text.substring(0, 45).replace(/[\r\n#*]/g, " ").trim() + "...";
    } else {
      // Eğer henüz cevap yoksa kullanıcı sorusunu geçici başlık yap
      title = currentMessages[0].text.substring(0, 40) + (currentMessages[0].text.length > 40 ? "..." : "");
    }

    const sessionIndex = chatSessions.findIndex(s => s.id === currentSessionId);
    const session = { id: currentSessionId, title, messages: currentMessages };
    
    if (sessionIndex > -1) chatSessions[sessionIndex] = session;
    else chatSessions.push(session);
    
    await chrome.storage.local.set({ lumina_sessions: chatSessions });
  }

  function restoreSession(session) {
    currentSessionId = session.id;
    currentMessages = [...session.messages];
    chatHistory.innerHTML = '';
    currentMessages.forEach(m => appendMessage(m.text, m.isUser, true));
    switchView('chat');
  }

  function startNewChat() {
    currentSessionId = Date.now();
    currentMessages = [];
    chatHistory.innerHTML = '';
    if (welcomeScreen) chatHistory.appendChild(welcomeScreen);
    switchView('chat');
  }

  // --- Notes Logic ---
  async function loadNotes() {
    try {
      const data = await chrome.storage.local.get({ lumina_notes: [] });
      notes = Array.isArray(data.lumina_notes) ? data.lumina_notes : [];
      renderNotes();
    } catch (e) { console.error(e); }
  }

  function renderNotes() {
    const notesContainer = document.getElementById('lumina-notes-container');
    if (!notesContainer) return;
    if (notes.length === 0) {
      notesContainer.innerHTML = `<div class="lumina-empty-notes"><span>Henüz notunuz yok.</span></div>`;
      return;
    }
    notesContainer.innerHTML = '';
    notes.slice().reverse().forEach((note) => {
      const card = document.createElement('div');
      card.className = 'lumina-note-card';
      card.innerHTML = `
        <div class="lumina-note-content">${note.content}</div>
        <div class="lumina-note-footer">
          <span>${new Date(note.id).toLocaleDateString('tr-TR')}</span>
          <span class="lumina-note-delete">Sil</span>
        </div>
      `;
      card.querySelector('.lumina-note-delete').addEventListener('click', () => deleteNote(note.id));
      notesContainer.appendChild(card);
    });
  }

  async function addNote(content) {
    if (!content || !content.trim()) return;
    const newNote = { id: Date.now(), content: content.trim() };
    notes.push(newNote);
    await chrome.storage.local.set({ lumina_notes: notes });
    if (notesArea && notesArea.classList.contains('active')) renderNotes();
  }

  async function deleteNote(id) {
    notes = notes.filter(n => n.id !== id);
    await chrome.storage.local.set({ lumina_notes: notes });
    renderNotes();
  }

  function switchView(view) {
    const views = [
      { btn: chatViewBtn, area: chatHistory, name: 'chat' },
      { btn: historyViewBtn, area: historyArea, name: 'history' },
      { btn: notesViewBtn, area: notesArea, name: 'notes' }
    ];

    views.forEach(v => {
      if (v.btn) v.btn.classList.toggle('active', v.name === view);
      if (v.area) {
        if (v.name === 'chat') v.area.classList.toggle('hidden', v.name !== view);
        else v.area.classList.toggle('active', v.name === view);
      }
    });

    if (inputContainer) inputContainer.style.display = (view === 'chat' ? 'block' : 'none');
    if (view === 'history') loadHistory();
    if (view === 'notes') loadNotes();
  }

  async function sendMessage(text) {
    const query = text.trim() || "Açıkla.";
    appendMessage(query, true);
    const cType = activeContext ? activeContext.type : 'general';
    const cData = activeContext ? activeContext.data : '';
    const currentRequestId = Date.now();
    
    input.value = '';
    input.style.height = 'auto';
    clearContext();
    
    const aiBubble = appendMessage("", false);
    let fullReply = "";
    const port = getPort();
    
    port.postMessage({ 
      type: 'PROCESS_QUERY', 
      payload: { query, contextType: cType, contextData: cData, requestId: currentRequestId } 
    });

    const messageHandler = (msg) => {
      if (msg.requestId && msg.requestId !== currentRequestId) return;

      if (msg.type === 'chunk') {
        fullReply += msg.payload;
        aiBubble.innerHTML = parseMarkdown(fullReply);
        chatHistory.scrollTop = chatHistory.scrollHeight;
      } else if (msg.type === 'done' || msg.type === 'error') {
        if (msg.type === 'error') {
          aiBubble.innerHTML = `<div style="color: #ef4444; background: rgba(239, 68, 68, 0.1); padding: 10px; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.2);">
            <strong>Hata:</strong> ${msg.payload}
          </div>`;
        }
        
        const lastMsg = currentMessages[currentMessages.length - 1];
        if (lastMsg && !lastMsg.isUser) lastMsg.text = fullReply;
        updateCurrentSession();
        
        port.onMessage.removeListener(messageHandler);
        sendBtn.disabled = false;
      }
    };
    port.onMessage.addListener(messageHandler);
    sendBtn.disabled = true;
  }

  function clearContext() {
    activeContext = null;
    if (contextWrapper) contextWrapper.classList.remove('active');
    if (sendBtn && input && !input.value.trim()) sendBtn.classList.remove('active');
  }

  // --- Listeners ---
  if (chatViewBtn) chatViewBtn.addEventListener('click', () => switchView('chat'));
  if (historyViewBtn) historyViewBtn.addEventListener('click', () => switchView('history'));
  if (notesViewBtn) notesViewBtn.addEventListener('click', () => switchView('notes'));
  
  const newChatBtn = document.getElementById('lumina-btn-new-chat');
  if (newChatBtn) newChatBtn.addEventListener('click', startNewChat);

  const addNoteManualBtn = document.getElementById('lumina-btn-add-note-manual');
  if (addNoteManualBtn) {
    addNoteManualBtn.addEventListener('click', () => {
      const ui = document.getElementById('lumina-new-note-ui');
      if (ui) {
        ui.classList.toggle('active');
        const txt = document.getElementById('lumina-note-text-input');
        if (txt) txt.focus();
      }
    });
  }

  const cancelNoteBtn = document.getElementById('lumina-btn-cancel-note');
  if (cancelNoteBtn) {
    cancelNoteBtn.addEventListener('click', () => {
      const ui = document.getElementById('lumina-new-note-ui');
      if (ui) ui.classList.remove('active');
    });
  }

  const saveManualBtn = document.getElementById('lumina-btn-save-manual-note');
  if (saveManualBtn) {
    saveManualBtn.addEventListener('click', async () => {
      const txt = document.getElementById('lumina-note-text-input');
      if (txt) {
        await addNote(txt.value);
        txt.value = '';
        const ui = document.getElementById('lumina-new-note-ui');
        if (ui) ui.classList.remove('active');
      }
    });
  }

  if (contextClear) contextClear.addEventListener('click', clearContext);

  if (input) {
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
  }

  if (sendBtn) sendBtn.addEventListener('click', () => sendMessage(input.value));

  const pasteBtn = document.getElementById('lumina-btn-paste-clipboard');
  if (pasteBtn) {
    pasteBtn.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (input) {
          input.value += text;
          input.dispatchEvent(new Event('input'));
          input.focus();
        }
      } catch (err) {
        console.error('Yapıştırma hatası:', err);
      }
    });
  }

  const summInputBtn = document.getElementById('lumina-btn-summarize-input');
  if (summInputBtn) {
    summInputBtn.addEventListener('click', async () => {
      switchView('chat');
      appendMessage("Sayfa içeriği analiz ediliyor (tüm çerçeveler dahil)...", false);
      
      const pageText = await collectAllFramesContent();
      
      if (!pageText || pageText.length < 20) {
        appendMessage("Sayfa içeriği okunamadı. Lütfen sayfanın yüklendiğinden emin olun.", false);
        return;
      }
      activeContext = { type: 'page', data: pageText };
      sendMessage("Bu sayfayı özetle.");
    });
  }

  async function collectAllFramesContent() {
    // 1. Get top frame content
    let topContent = getPageContent();
    let framesData = [];
    
    // 2. Ask background script to get content from other frames
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_ALL_FRAMES_CONTENT' });
      if (response && response.contents) {
        // Only include frames that have a decent amount of content to avoid sidebars/ads
        framesData = response.contents.filter(c => c.length > 300);
      }
    } catch (e) {
      console.log("Diğer çerçevelerden içerik alınamadı:", e);
    }
    
    // Combine and prioritize the largest content block
    const allBlocks = [topContent, ...framesData].filter(b => b.length > 50);
    allBlocks.sort((a, b) => b.length - a.length);
    
    return allBlocks.join("\n\n---\n\n").trim();
  }

  document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    if (!panel || !tooltip || panel.contains(selection.anchorNode) || text.length <= 5) {
      if (tooltip) tooltip.classList.remove('active');
      return;
    }
    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      tooltip.style.top = `${rect.top - 45}px`;
      tooltip.style.left = `${rect.left + (rect.width / 2) - 60}px`;
      tooltip.classList.add('active');
    } catch(e) {}
  });

  document.addEventListener('mousedown', (e) => {
    if (tooltip && !tooltip.contains(e.target)) tooltip.classList.remove('active');
  });

  const ttSummarize = document.getElementById('lumina-tt-summarize');
  if (ttSummarize) {
    ttSummarize.addEventListener('click', () => {
      const text = window.getSelection().toString().trim();
      if (panel) panel.classList.add('lumina-active');
      activeContext = { type: 'selection', data: text };
      sendMessage("Bu metni özetle.");
    });
  }

  const ttExplain = document.getElementById('lumina-tt-explain');
  if (ttExplain) {
    ttExplain.addEventListener('click', () => {
      const text = window.getSelection().toString().trim();
      if (panel) panel.classList.add('lumina-active');
      activeContext = { type: 'selection', data: text };
      sendMessage("Bunu açıkla.");
    });
  }

  document.querySelectorAll('.lumina-quick-prompt').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.target.closest('.lumina-quick-prompt');
      const p = target.getAttribute('data-prompt');
      const ctx = target.getAttribute('data-context');
      if (ctx === 'page') {
        appendMessage("Sayfa analizi başlatıldı...", false);
        const pageText = await collectAllFramesContent();
        if (!pageText || pageText.length < 20) {
          appendMessage("İçerik çekilemedi.", false);
          return;
        }
        activeContext = { type: 'page', data: pageText };
      }
      sendMessage(p);
    });
  });

  const closeBtn = document.getElementById('lumina-btn-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (panel) panel.classList.remove('lumina-active');
      if (tooltip) tooltip.classList.remove('active');
    });
  }

  const settingsBtn = document.getElementById('lumina-btn-settings');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' }));
  }

  chrome.runtime.onMessage.addListener((request) => {
    if (!panel) return;
    if (request.type === 'TOGGLE_SIDE_PANEL') {
      panel.classList.toggle('lumina-active');
      if (panel.classList.contains('lumina-active') && input) input.focus();
    } else if (request.type === 'OPEN_AND_SUMMARIZE_SELECTION') {
      panel.classList.add('lumina-active');
      activeContext = { type: 'selection', data: request.payload };
      sendMessage("Bu metni özetle.");
    }
  });

  const resizeHandle = document.getElementById('lumina-ai-resize-handle');
  if (resizeHandle && panel) {
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
  }
})();
