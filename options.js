// options.js
const providerApiKeyHints = {
  grok:      { placeholder: "xai-...",        hint: "xAI Grok API anahtarı → <a href='https://console.x.ai' target='_blank'>console.x.ai</a>" },
  groq:      { placeholder: "gsk_...",        hint: "Groq Cloud API anahtarı → <a href='https://console.groq.com' target='_blank'>console.groq.com</a>" },
  openai:    { placeholder: "sk-...",          hint: "OpenAI API anahtarı → <a href='https://platform.openai.com/api-keys' target='_blank'>platform.openai.com</a>" },
  gemini:    { placeholder: "AIzaSy...",       hint: "Google AI Studio → <a href='https://aistudio.google.com/apikey' target='_blank'>aistudio.google.com</a>" },
  anthropic: { placeholder: "sk-ant-api03-...", hint: "Anthropic API anahtarı → <a href='https://console.anthropic.com/settings/keys' target='_blank'>console.anthropic.com</a>" }
};

const providerModels = {
  grok:      "grok-4.20-reasoning",
  groq:      "llama-3.3-70b-versatile",
  openai:    "gpt-4o",
  gemini:    "gemini-2.0-flash",
  anthropic: "claude-sonnet-4-5"
};

const providerHints = {
  grok:      "Örn: <code>grok-4.20-reasoning</code>, <code>grok-3</code>",
  groq:      "Örn: <code>llama-3.3-70b-versatile</code>, <code>deepseek-r1-distill-llama-70b</code>",
  openai:    "Örn: <code>gpt-4o</code>, <code>gpt-4o-mini</code>, <code>o3-mini</code>",
  gemini:    "Örn: <code>gemini-2.0-flash</code>, <code>gemini-2.5-pro</code>",
  anthropic: "Örn: <code>claude-sonnet-4-5</code>, <code>claude-opus-4-5</code>"
};

function saveOptions() {
  const provider = document.getElementById('provider').value;
  const apiKey = document.getElementById('apiKey').value;
  const modelName = document.getElementById('modelName').value || providerModels[provider];
  const panelOpacity = document.getElementById('panelOpacity').value;

  chrome.storage.local.set({
    activeProvider: provider,
    apiKey: apiKey,
    modelName: modelName,
    panelOpacity: panelOpacity
  }, () => {
    const status = document.getElementById('status');
    status.textContent = 'Ayarlar başarıyla güncellendi';
    status.className = 'status success';
    setTimeout(() => {
      status.textContent = '';
      status.className = 'status';
    }, 2000);
  });
}

function restoreOptions() {
  chrome.storage.local.get({
    activeProvider: 'grok',
    apiKey: '',
    modelName: '',
    panelOpacity: '90'
  }, (items) => {
    document.getElementById('provider').value = items.activeProvider;
    document.getElementById('apiKey').value = items.apiKey;
    document.getElementById('modelName').value = items.modelName;
    document.getElementById('panelOpacity').value = items.panelOpacity;
    document.getElementById('opacityValue').textContent = items.panelOpacity + '%';
    updateHint(items.activeProvider);
  });
}

function updateHint(provider) {
  document.getElementById('modelHint').innerHTML = providerHints[provider];
  const modelInput = document.getElementById('modelName');
  if (!modelInput.value) {
    modelInput.placeholder = `Varsayılan: ${providerModels[provider]}`;
  }
  const apiInfo = providerApiKeyHints[provider];
  if (apiInfo) {
    document.getElementById('apiKey').placeholder = apiInfo.placeholder;
    document.getElementById('apiKeyHint').innerHTML = apiInfo.hint;
  }
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('provider').addEventListener('change', (e) => updateHint(e.target.value));
document.getElementById('panelOpacity').addEventListener('input', (e) => {
  document.getElementById('opacityValue').textContent = e.target.value + '%';
});
