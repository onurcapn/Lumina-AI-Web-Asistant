// background.js

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "summarize-selection",
    title: "Lumina AI ile Özetle",
    contexts: ["selection"]
  });
});

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SIDE_PANEL' });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "summarize-selection") {
    chrome.tabs.sendMessage(tab.id, {
      type: 'OPEN_AND_SUMMARIZE_SELECTION',
      payload: info.selectionText
    });
  }
});

// Port-based communication for streaming
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "lumina-stream") return;

  port.onMessage.addListener(async (request) => {
    if (request.type === 'PROCESS_QUERY') {
      const { query, contextType, contextData, requestId } = request.payload;

      try {
        const settings = await chrome.storage.local.get({
          activeProvider: 'grok',
          apiKey: '',
          modelName: ''
        });
        const { activeProvider, apiKey, modelName } = settings;
        
        const cleanApiKey = apiKey.replace(/[^\x20-\x7E]/g, "").trim();

        if (!cleanApiKey) {
          port.postMessage({ type: 'error', payload: "API anahtarı bulunamadı veya geçersiz karakterler içeriyor. Lütfen ayarlar kontrol edin.", requestId });
          return;
        }

        const systemPrompt = "Sen Lumina AI asistanısın. Türkçe yanıt ver. Yanıtlarını Markdown formatında yapılandır. ÖNEMLİ: Sadece sayfanın ASIL ve ANA konusuna odaklan. Sayfadaki çerez uyarıları, yasal bildirimler, yan menüdeki alakasız tanımlar veya reklam içeriklerini kesinlikle özetine dahil etme. Eğer birden fazla konu varsa, sadece en kapsamlı olanı ve kullanıcının muhtemelen ilgilendiği ana ders/makale içeriğini özetle.";
        let userMessage = query;
        if (contextType === 'page') {
          userMessage = `SAYFA İÇERİĞİ:\n${contextData}\n\nİSTEK: ${query}`;
        } else if (contextType === 'selection') {
          userMessage = `SEÇİLİ METİN:\n${contextData}\n\nİSTEK: ${query}`;
        }

        if (activeProvider === 'openai' || activeProvider === 'groq') {
          await streamOpenAICompatible(port, activeProvider, cleanApiKey, modelName, systemPrompt, userMessage, requestId);
        } else if (activeProvider === 'grok') {
          await streamGrok(port, cleanApiKey, modelName, systemPrompt, userMessage, requestId);
        } else if (activeProvider === 'gemini') {
          await streamGemini(port, cleanApiKey, modelName, systemPrompt, userMessage, requestId);
        } else if (activeProvider === 'anthropic') {
          await streamAnthropic(port, cleanApiKey, modelName, systemPrompt, userMessage, requestId);
        } else {
          port.postMessage({ type: 'error', payload: "Geçersiz sağlayıcı seçildi.", requestId });
        }

      } catch (error) {
        console.error("Stream Error:", error);
        port.postMessage({ type: 'error', payload: `Yanıt alınırken bir hata oluştu: ${error.message}`, requestId });
      }
    }
  });
});

// ─── OpenAI & Groq (LPU) Streaming ──────────────────────────────────────────
async function streamOpenAICompatible(port, provider, apiKey, modelName, systemPrompt, userMessage, requestId) {
  const endpoint = provider === 'openai' 
    ? "https://api.openai.com/v1/chat/completions"
    : "https://api.groq.com/openai/v1/chat/completions";

  const defaultModel = provider === 'openai' ? "gpt-4o" : "llama-3.3-70b-versatile";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelName || defaultModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      stream: true
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errMsg = errData.error?.message || response.statusText;
    throw new Error(`${provider.toUpperCase()} API Hatası (${response.status}): ${errMsg}`);
  }

  await readSSEStream(port, response, requestId);
}

// ─── xAI Grok Streaming ──────────────────────────────────────────────────────
async function streamGrok(port, apiKey, modelName, systemPrompt, userMessage, requestId) {
  const endpoint = "https://api.x.ai/v1/chat/completions";
  const model = modelName || "grok-2-1212";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      stream: true
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errMsg = errData.error?.message || response.statusText;
    throw new Error(`Grok API Hatası (${response.status}): ${errMsg}`);
  }

  await readSSEStream(port, response, requestId);
}

// ─── Google Gemini Streaming ──────────────────────────────────────────────────
async function streamGemini(port, apiKey, modelName, systemPrompt, userMessage, requestId) {
  const model = modelName || "gemini-2.0-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        { role: "user", parts: [{ text: userMessage }] }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096
      }
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errMsg = errData?.[0]?.error?.message || response.statusText;
    throw new Error(`Gemini API Hatası (${response.status}): ${errMsg}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.substring(6));
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            port.postMessage({ type: 'chunk', payload: text, requestId });
          }
        } catch (e) { /* skip */ }
      }
    }
  }

  port.postMessage({ type: 'done', requestId });
}

// ─── Anthropic Claude Streaming ───────────────────────────────────────────────
async function streamAnthropic(port, apiKey, modelName, systemPrompt, userMessage, requestId) {
  const model = modelName || "claude-3-5-sonnet-20241022";

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
      stream: true
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errMsg = errData.error?.message || response.statusText;
    throw new Error(`Anthropic API Hatası (${response.status}): ${errMsg}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.substring(6));
          if (data.type === "content_block_delta" && data.delta?.type === "text_delta") {
            port.postMessage({ type: 'chunk', payload: data.delta.text, requestId });
          }
        } catch (e) { /* skip */ }
      }
    }
  }

  port.postMessage({ type: 'done', requestId });
}

// ─── Generic SSE Reader (OpenAI / Grok format) ────────────────────────────────
async function readSSEStream(port, response, requestId) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("data: ") && trimmedLine !== "data: [DONE]") {
        try {
          const data = JSON.parse(trimmedLine.substring(6));
          const content = data.choices?.[0]?.delta?.content;
          if (content) {
            port.postMessage({ type: 'chunk', payload: content, requestId });
          }
        } catch (e) { /* skip */ }
      }
    }
  }

  port.postMessage({ type: 'done', requestId });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'OPEN_OPTIONS') {
    chrome.runtime.openOptionsPage();
  } else if (request.type === 'GET_ALL_FRAMES_CONTENT') {
    const tabId = sender.tab.id;
    
    chrome.webNavigation.getAllFrames({ tabId }, (frames) => {
      if (!frames) {
        sendResponse({ contents: [] });
        return;
      }
      
      const otherFrames = frames.filter(f => f.frameId !== 0 && f.errorOccurred === false);
      const promises = otherFrames.map(f => {
        return new Promise(resolve => {
          chrome.tabs.sendMessage(tabId, { type: 'COLLECT_CONTENT' }, { frameId: f.frameId }, (resp) => {
            resolve(resp ? resp.content : "");
          });
        });
      });
      
      Promise.all(promises).then(results => {
        sendResponse({ contents: results.filter(c => c && c.length > 100) });
      });
    });
    return true; // Keep channel open for async response
  }
});
