// options.js
const translations = {
  tr: {
    title: "Lumina AI Yapılandırması",
    subtitle: "Yapay zeka sağlayıcınızı seçin ve API anahtarınızı girin.",
    labelProvider: "Yapay Zeka Sağlayıcı",
    labelApiKey: "API Anahtarı",
    labelModelName: "Model İsmi",
    labelOpacity: "Panel Saydamlığı",
    btnSave: "Değişiklikleri Kaydet",
    statusSuccess: "Ayarlar başarıyla güncellendi",
    apiKeyHint: "Anahtarınız yalnızca tarayıcınızda yerel olarak saklanır.",
    modelPlaceholder: "Varsayılan model kullanılır",
    apiPlaceholder: "API anahtarınızı girin...",
    defaultLabel: "Varsayılan: "
  },
  en: {
    title: "Lumina AI Configuration",
    subtitle: "Choose your AI provider and enter your API key.",
    labelProvider: "AI Provider",
    labelApiKey: "API Key",
    labelModelName: "Model Name",
    labelOpacity: "Panel Opacity",
    btnSave: "Save Changes",
    statusSuccess: "Settings updated successfully",
    apiKeyHint: "Your key is stored locally in your browser only.",
    modelPlaceholder: "Default model will be used",
    apiPlaceholder: "Enter your API key...",
    defaultLabel: "Default: "
  }
};

const providerApiKeyHints = {
  grok:      { placeholder: "xai-...",        hint: { tr: "xAI Grok API anahtarı → <a href='https://console.x.ai' target='_blank'>console.x.ai</a>", en: "xAI Grok API key → <a href='https://console.x.ai' target='_blank'>console.x.ai</a>" } },
  groq:      { placeholder: "gsk_...",        hint: { tr: "Groq Cloud API anahtarı → <a href='https://console.groq.com' target='_blank'>console.groq.com</a>", en: "Groq Cloud API key → <a href='https://console.groq.com' target='_blank'>console.groq.com</a>" } },
  openai:    { placeholder: "sk-...",          hint: { tr: "OpenAI API anahtarı → <a href='https://platform.openai.com/api-keys' target='_blank'>platform.openai.com</a>", en: "OpenAI API key → <a href='https://platform.openai.com/api-keys' target='_blank'>platform.openai.com</a>" } },
  gemini:    { placeholder: "AIzaSy...",       hint: { tr: "Google AI Studio → <a href='https://aistudio.google.com/apikey' target='_blank'>aistudio.google.com</a>", en: "Google AI Studio → <a href='https://aistudio.google.com/apikey' target='_blank'>aistudio.google.com</a>" } },
  anthropic: { placeholder: "sk-ant-api03-...", hint: { tr: "Anthropic API anahtarı → <a href='https://console.anthropic.com/settings/keys' target='_blank'>console.anthropic.com</a>", en: "Anthropic API key → <a href='https://console.anthropic.com/settings/keys' target='_blank'>console.anthropic.com</a>" } }
};

const providerModels = {
  grok:      "grok-2-1212",
  groq:      "llama-3.3-70b-versatile",
  openai:    "gpt-4o",
  gemini:    "gemini-2.0-flash",
  anthropic: "claude-3-5-sonnet-20241022"
};

const providerHints = {
  tr: {
    grok:      "Örn: <code>grok-2-1212</code>, <code>grok-beta</code>",
    groq:      "Örn: <code>llama-3.3-70b-versatile</code>, <code>deepseek-r1-distill-llama-70b</code>",
    openai:    "Örn: <code>gpt-4o</code>, <code>gpt-4o-mini</code>, <code>o3-mini</code>",
    gemini:    "Örn: <code>gemini-2.0-flash</code>, <code>gemini-1.5-pro</code>",
    anthropic: "Örn: <code>claude-3-5-sonnet-20241022</code>, <code>claude-3-opus-20240229</code>"
  },
  en: {
    grok:      "e.g., <code>grok-2-1212</code>, <code>grok-beta</code>",
    groq:      "e.g., <code>llama-3.3-70b-versatile</code>, <code>deepseek-r1-distill-llama-70b</code>",
    openai:    "e.g., <code>gpt-4o</code>, <code>gpt-4o-mini</code>, <code>o3-mini</code>",
    gemini:    "e.g., <code>gemini-2.0-flash</code>, <code>gemini-1.5-pro</code>",
    anthropic: "e.g., <code>claude-3-5-sonnet-20241022</code>, <code>claude-3-opus-20240229</code>"
  }
};

let currentLang = 'tr';

function applyTranslations(lang) {
  currentLang = lang;
  const t = translations[lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.textContent = t[key];
  });
  
  document.getElementById('modelName').placeholder = t.modelPlaceholder;
  document.getElementById('apiKey').placeholder = t.apiPlaceholder;
  
  updateHint(document.getElementById('provider').value);
}

function saveOptions() {
  const provider = document.getElementById('provider').value;
  const apiKey = document.getElementById('apiKey').value;
  const modelName = document.getElementById('modelName').value || providerModels[provider];
  const panelOpacity = document.getElementById('panelOpacity').value;
  const lang = document.getElementById('language').value;

  chrome.storage.local.set({
    activeProvider: provider,
    apiKey: apiKey,
    modelName: modelName,
    panelOpacity: panelOpacity,
    language: lang
  }, () => {
    const status = document.getElementById('status');
    status.textContent = translations[lang].statusSuccess;
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
    panelOpacity: '90',
    language: 'tr'
  }, (items) => {
    document.getElementById('provider').value = items.activeProvider;
    document.getElementById('apiKey').value = items.apiKey;
    document.getElementById('modelName').value = items.modelName;
    document.getElementById('panelOpacity').value = items.panelOpacity;
    document.getElementById('language').value = items.language;
    document.getElementById('opacityValue').textContent = items.panelOpacity + '%';
    applyTranslations(items.language);
  });
}

function updateHint(provider) {
  document.getElementById('modelHint').innerHTML = providerHints[currentLang][provider];
  const modelInput = document.getElementById('modelName');
  if (!modelInput.value) {
    modelInput.placeholder = `${translations[currentLang].defaultLabel}${providerModels[provider]}`;
  }
  const apiInfo = providerApiKeyHints[provider];
  if (apiInfo) {
    document.getElementById('apiKeyHint').innerHTML = apiInfo.hint[currentLang];
  }
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('language').addEventListener('change', (e) => applyTranslations(e.target.value));
document.getElementById('provider').addEventListener('change', (e) => updateHint(e.target.value));
document.getElementById('panelOpacity').addEventListener('input', (e) => {
  document.getElementById('opacityValue').textContent = e.target.value + '%';
});
