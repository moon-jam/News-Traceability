const apiKeyInput = document.getElementById('api-key');
const saveButton = document.getElementById('save-button');

saveButton.addEventListener('click', () => {
  const apiKey = apiKeyInput.value.trim();
  if (apiKey) {
    chrome.storage.local.set({'geminiApiKey': apiKey}, function() {
      alert('API key saved successfully!');
    });
  }
});

// Load API key from local storage when the options page loads
chrome.storage.local.get('geminiApiKey', function(result) {
  if (result.geminiApiKey) {
    apiKeyInput.value = result.geminiApiKey;
  }
});