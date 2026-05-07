// options.js
const providerHints = {
  grok: "Örn: grok-beta veya grok-vision-beta",
  openai: "Örn: gpt-4o, gpt-4o-mini veya o1-preview",
  gemini: "Örn: gemini-1.5-pro veya gemini-1.5-flash",
  anthropic: "Örn: claude-3-5-sonnet-20240620"
};

const providerModels = {
  grok: "grok-beta",
  openai: "gpt-4o",
  gemini: "gemini-1.5-pro",
  anthropic: "claude-3-5-sonnet-20240620"
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
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('provider').addEventListener('change', (e) => updateHint(e.target.value));
document.getElementById('panelOpacity').addEventListener('input', (e) => {
  document.getElementById('opacityValue').textContent = e.target.value + '%';
});
