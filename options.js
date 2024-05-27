const apiKeyInput = document.getElementById('api-key');
const saveButton = document.getElementById('save-button');
const spinner = document.getElementById('spinner');
const statusIcon = document.getElementById('status-icon');
const message = document.getElementById('message');

saveButton.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  
  // 顯示加載動畫
  spinner.style.display = 'inline-block';
  statusIcon.style.display = 'none';
  message.style.display = 'none';

  if (await checkApiKey(apiKey)) {
    chrome.storage.local.set({'geminiApiKey': apiKey, 'isEnabled': true}, function() {
      // 顯示綠色打勾和成功訊息
      statusIcon.className = 'status-icon success';
      message.className = 'success';
      message.textContent = '認證成功';
    });
  } else {
    // 顯示紅色打叉和錯誤訊息
    statusIcon.className = 'status-icon error';
    message.className = 'error';
    message.textContent = '認證失敗';
    // 清除輸入框
    apiKeyInput.value = '';
  }

  // 隱藏加載動畫並顯示狀態圖標和訊息
  spinner.style.display = 'none';
  statusIcon.style.display = 'inline-block';
  message.style.display = 'block';
});

// 加載選項頁面時從本地存儲加載 API 鑰匙
chrome.storage.local.get('geminiApiKey', function(result) {
  if (result.geminiApiKey) {
    apiKeyInput.value = result.geminiApiKey;
  }
});

async function checkApiKey(apiKey) {
  const modelId = "gemini-1.5-flash-latest";
  try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`, {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
              contents: [{
                  parts: [{ 
                      text: "test"
                  }]
              }]
          })
      });

      if (response.ok) {
          return true;
      } else {
          return false;
      }
  } catch (error) {
      // 處理網絡錯誤
      return false;
  }
}
