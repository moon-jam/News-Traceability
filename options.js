const apiKeyInput = document.getElementById('api-key');
const saveButton = document.getElementById('save-button');

saveButton.addEventListener('click', () => {
  const apiKey = apiKeyInput.value.trim();
  if (apiKey) {
    localStorage.setItem('geminiApiKey', apiKey);
    alert('API key saved successfully!');
  }
});

// Load API key from local storage when the options page loads
const storedApiKey = localStorage.getItem('geminiApiKey');
if (storedApiKey) {
  apiKeyInput.value = storedApiKey;
}
