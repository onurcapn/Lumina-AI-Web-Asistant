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
      const { query, contextType, contextData } = request.payload;

      try {
        const settings = await chrome.storage.local.get({
          activeProvider: 'grok',
          apiKey: '',
          modelName: ''
        });
        const { activeProvider, apiKey, modelName } = settings;
        
        // Agresif temizlik: Sadece ASCII karakterlere izin ver, tüm gizli karakterleri sil
        const cleanApiKey = apiKey.replace(/[^\x20-\x7E]/g, "").trim();

        if (!cleanApiKey) {
          port.postMessage({ type: 'error', payload: "API anahtarı bulunamadı veya geçersiz karakterler içeriyor. Lütfen ayarları kontrol edin." });
          return;
        }

        const systemPrompt = "Sen Lumina AI asistanısın. Türkçe yanıt ver. Yanıtlarını Markdown formatında (bold, lists, code blocks) yapılandır.";
        let userMessage = query;
        if (contextType === 'page') {
          userMessage = `SAYFA İÇERİĞİ:\n${contextData}\n\nİSTEK: ${query}`;
        } else if (contextType === 'selection') {
          userMessage = `SEÇİLİ METİN:\n${contextData}\n\nİSTEK: ${query}`;
        }

        if (activeProvider === 'openai' || activeProvider === 'groq') {
          await streamOpenAICompatible(port, activeProvider, cleanApiKey, modelName, systemPrompt, userMessage);
        } else if (activeProvider === 'grok') {
          await streamGrok(port, cleanApiKey, modelName, systemPrompt, userMessage);
        } else if (activeProvider === 'gemini') {
          await streamGemini(port, cleanApiKey, modelName, systemPrompt, userMessage);
        } else if (activeProvider === 'anthropic') {
          await streamAnthropic(port, cleanApiKey, modelName, systemPrompt, userMessage);
        } else {
          port.postMessage({ type: 'error', payload: "Geçersiz sağlayıcı seçildi." });
        }

      } catch (error) {
        console.error("Stream Error:", error);
        port.postMessage({ type: 'error', payload: `Yanıt alınırken bir hata oluştu: ${error.message}` });
      }
    }
  });
});

// ─── OpenAI & Groq (LPU) Streaming ──────────────────────────────────────────
async function streamOpenAICompatible(port, provider, apiKey, modelName, systemPrompt, userMessage) {
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
    const errText = await response.text();
    throw new Error(`OpenAI API Hatası (${response.status}): ${errText}`);
  }

  await readSSEStream(port, response);
}

// ─── xAI Grok (v1/responses format) ──────────────────────────────────────────
async function streamGrok(port, apiKey, modelName, systemPrompt, userMessage) {
  const endpoint = "https://api.x.ai/v1/responses";
  const model = modelName || "grok-4.20-reasoning";

  // Note: Your curl uses "input", we combine system prompt for best results
  const fullInput = `${systemPrompt}\n\nİstek: ${userMessage}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      input: fullInput,
      stream: true // Attempting stream if supported by this endpoint
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Grok API Hatası (${response.status}): ${errText}`);
  }

  // If this endpoint follows SSE, we can use the same reader
  // If it's a direct response, we'd handle it differently. 
  // Based on your extension architecture, we'll try to read it as SSE.
  await readSSEStream(port, response);
}

// ─── Google Gemini Streaming ──────────────────────────────────────────────────
async function streamGemini(port, apiKey, modelName, systemPrompt, userMessage) {
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
        maxOutputTokens: 2048
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API Hatası (${response.status}): ${errText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.substring(6));
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            port.postMessage({ type: 'chunk', payload: text });
          }
        } catch (e) { /* partial JSON, skip */ }
      }
    }
  }

  port.postMessage({ type: 'done' });
}

// ─── Anthropic Claude Streaming ───────────────────────────────────────────────
async function streamAnthropic(port, apiKey, modelName, systemPrompt, userMessage) {
  const model = modelName || "claude-sonnet-4-5";

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
      stream: true
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API Hatası (${response.status}): ${errText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.substring(6));
          if (data.type === "content_block_delta" && data.delta?.type === "text_delta") {
            port.postMessage({ type: 'chunk', payload: data.delta.text });
          }
        } catch (e) { /* partial JSON, skip */ }
      }
    }
  }

  port.postMessage({ type: 'done' });
}

// ─── Generic SSE Reader (OpenAI / Grok format) ────────────────────────────────
async function readSSEStream(port, response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ") && line !== "data: [DONE]") {
        try {
          const data = JSON.parse(line.substring(6));
          const content = data.choices?.[0]?.delta?.content;
          if (content) {
            port.postMessage({ type: 'chunk', payload: content });
          }
        } catch (e) { /* partial JSON, skip */ }
      }
    }
  }

  port.postMessage({ type: 'done' });
}

chrome.runtime.onMessage.addListener((request) => {
  if (request.type === 'OPEN_OPTIONS') {
    chrome.runtime.openOptionsPage();
  }
});
