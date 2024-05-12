chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {

    if (changeInfo.status === 'complete' && /^https?:/.test(tab.url)) {
        chrome.scripting.executeScript({
            target: {tabId: tabId},
            files: ['content.js']
        }, () => {
            chrome.storage.local.get('apiKey', function(data) {
                alert(data.apiKey);
                // Example: fetch the text content from the content script
                chrome.tabs.sendMessage(tabId, {action: "fetchData"}, function(response) {
                    fetch('https://api.gemini.com/analyze', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${data.apiKey}`
                        },
                        body: JSON.stringify({content: response.data})
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log('Data received:', data);
                        chrome.tabs.sendMessage(tabId, {action: "displayData", data: data});
                    })
                    .catch(error => console.error('API error:', error));
                });
            });
        });
    }
});
