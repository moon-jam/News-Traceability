const toggleSwitch = document.getElementById('toggle-switch');
const switchLabel = document.getElementById('switch-label');
let isEnabled = toggleSwitch.checked;

toggleSwitch.addEventListener('change', function() {
    chrome.storage.local.set({ isEnabled: toggleSwitch.checked });
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.update(tabs[0].id, { url: tabs[0].url });
    });
    location.reload();
});

chrome.storage.local.get('isEnabled', function(data) {
    isEnabled = data.isEnabled;
    toggleSwitch.checked = isEnabled;
    console.log("is enabled:", isEnabled);
    if(!isEnabled) return;

    const regenerate = document.getElementById('regenerate-button');
    const outputText = document.getElementById('output-text');

    console.log("is enabled:", isEnabled);
    let dots = '';
    let intervalId = setInterval(function() {
        dots = (dots.length < 3) ? (dots + '.') : '.';
        chrome.tabs.query({ active: true }, function(tabs) {
            let currentUrl = tabs[0].url;
            // console.log("Current URL:", currentUrl);
            chrome.storage.local.get(currentUrl, function(result) {
                let info = result[currentUrl];
                if (info) {
                    outputText.innerHTML = 
`<span style="font-size: 20px; font-weight: bold; line-height: 2;">哪間媒體、誰的媒體？</span>
媒體名稱: ${info.media ? info.media.name : "Processing" + dots}
所屬公司: ${info.media ? info.media.company : "Processing" + dots}
上線日期: ${info.media ? info.media.date : "Processing" + dots}
相關訊息: ${info.media ? info.media.content : "Processing" + dots}
可信度分數: ${info.media ? info.media.score : "Processing" + dots}

<span style="font-size: 20px; font-weight: bold; line-height: 2;">誰寫的報導？</span>
${info.author ? info.author : "Processing" + dots}

<span style="font-size: 20px; font-weight: bold; line-height: 2;">誰給的消息？</span>
${info.source ? info.source : "Processing" + dots}

<span style="font-size: 20px; font-weight: bold; line-height: 2;">何時的新聞？</span>
${info.when ? info.when.happen : "Processing" + dots}
${info.when ? info.when.report : "Processing" + dots}

<span style="font-size: 20px; font-weight: bold; line-height: 2;">哪裡的新聞？</span>
${info.where ? info.where : "Processing" + dots}

<span style="font-size: 20px; font-weight: bold; line-height: 2;">是否煽動閱聽人情緒？</span>
${info.emotion ? info.emotion : "Processing" + dots}`;
                    
                } else {
                    outputText.textContent = ("並非新聞網站");
                }
            });
        });
    }, 400); // Update every 1 second
});

chrome.storage.local.get('geminiApiKey', function(result) {
    if (!result.geminiApiKey) {
        alert('請輸入Gemini API Key!');
    }
});
