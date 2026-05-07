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

        if (!apiKey || apiKey.trim() === '') {
          port.postMessage({ type: 'error', payload: "API anahtarı bulunamadı. Lütfen eklenti ayarlarından API anahtarınızı girin." });
          return;
        }

        const systemPrompt = "Sen Lumina AI asistanısın. Türkçe yanıt ver. Yanıtlarını Markdown formatında (bold, lists, code blocks) yapılandır.";
        let userMessage = query;
        if (contextType === 'page') {
          userMessage = `SAYFA İÇERİĞİ:\n${contextData}\n\nİSTEK: ${query}`;
        } else if (contextType === 'selection') {
          userMessage = `SEÇİLİ METİN:\n${contextData}\n\nİSTEK: ${query}`;
        }

        // Provider API Logic
        if (activeProvider === 'openai' || activeProvider === 'grok') {
          const endpoint = activeProvider === 'openai' 
            ? "https://api.openai.com/v1/chat/completions" 
            : "https://api.x.ai/v1/chat/completions";
          
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
            body: JSON.stringify({
              model: modelName || (activeProvider === 'openai' ? "gpt-4o" : "grok-beta"),
              messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }],
              stream: true
            })
          });

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let fullContent = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");
            
            for (const line of lines) {
              if (line.startsWith("data: ") && line !== "data: [DONE]") {
                try {
                  const data = JSON.parse(line.substring(6));
                  const content = data.choices[0].delta.content;
                  if (content) {
                    fullContent += content;
                    port.postMessage({ type: 'chunk', payload: content });
                  }
                } catch (e) {}
              }
            }
          }
          port.postMessage({ type: 'done' });
        } else {
          // Fallback for non-streaming for now (Gemini/Anthropic)
          // You can add real streaming for these too later
          const reply = await handleNonStreaming(activeProvider, apiKey, modelName, systemPrompt, userMessage);
          port.postMessage({ type: 'chunk', payload: reply });
          port.postMessage({ type: 'done' });
        }

      } catch (error) {
        console.error("Stream Error:", error);
        port.postMessage({ type: 'error', payload: "Yanıt alınırken bir hata oluştu." });
      }
    }
  });
});

async function handleNonStreaming(provider, apiKey, model, systemPrompt, userMessage) {
  if (provider === 'gemini') {
    const modelId = model || "gemini-1.5-pro";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt + "\n\n" + userMessage }] }] })
    });
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } else if (provider === 'anthropic') {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "dangerously-allow-browser": "true" },
      body: JSON.stringify({ model: model || "claude-3-5-sonnet-20240620", max_tokens: 1024, system: systemPrompt, messages: [{ role: "user", content: userMessage }] })
    });
    const data = await response.json();
    return data.content[0].text;
  }
  return "Hata: Geçersiz sağlayıcı.";
}

chrome.runtime.onMessage.addListener((request) => {
  if (request.type === 'OPEN_OPTIONS') {
    chrome.runtime.openOptionsPage();
  }
});
