const toggleSwitch = document.getElementById('toggle-switch');
const switchLabel = document.getElementById('switch-label');
const regenerateButton = document.getElementById('regenerate-button');
let isEnabled;
let still_loading = true;

async function getCurrentTab() {
    return new Promise((resolve, reject) => {
        chrome.windows.getLastFocused({ populate: true }, (window) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                const activeTab = window.tabs.find(tab => tab.active);
                resolve(activeTab);
            }
        });
    });
}

toggleSwitch.addEventListener('change', async function() {
    chrome.storage.local.set({ isEnabled: toggleSwitch.checked });
    isEnabled = toggleSwitch.checked;
    if(isEnabled) chrome.storage.local.set({ regenerate: true });
    chrome.tabs.reload(await getCurrentTab().id);
    location.reload();
});

regenerateButton.addEventListener('click', function() {
    chrome.storage.local.set({ regenerate: true });
});

document.getElementById("options-button").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
});

chrome.storage.local.get('isEnabled', function(data) {
    if(typeof data.isEnabled === 'undefined') 
        chrome.storage.local.set({ isEnabled: true });
    isEnabled = data.isEnabled;
    toggleSwitch.checked = isEnabled;
    console.log("is enabled:", isEnabled);
    if(!isEnabled) return;
    still_loading = true;

    const outputText = document.getElementById('output-text');

    console.log("is enabled:", isEnabled);
    let dots = '';
    let intervalId = setInterval(function() {
        dots = (dots.length < 3) ? (dots + '.') : '.';
        if(!still_loading) return;
        getCurrentTab().then(tab => {
            let currentUrl = tab.url;
            // console.log("Current URL:", currentUrl);
            chrome.storage.local.get(currentUrl, function(result) {
                let info = result[currentUrl];
                if (info) {
                    if(info.media && info.media.cert === "good") document.body.style.backgroundColor = "rgba(0, 200, 0, 0.2)";
                    if(info.media && info.media.cert === "bad") document.body.style.backgroundColor = "rgba(200, 0, 0, 0.5)";
                    outputText.innerHTML = 
`<span style="font-size: 20px; font-weight: bold; line-height: 2;">哪間媒體、誰的媒體？</span>
媒體名稱: ${info.media ? info.media.name : "Processing" + dots}
所屬公司: ${info.media ? info.media.company : "Processing" + dots}
上線日期: ${info.media ? info.media.date : "Processing" + dots}
相關訊息: ${info.media ? info.media.content : "Processing" + dots}
<a href="https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2023/taiwan" target="_blank">可信度分數</a>: ${info.media ? info.media.score : "Processing" + dots}

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

                    if(info.author) {
                        still_loading = false;
                        if(!info.media)
                            outputText.innerHTML = 
`<span style="font-size: 20px; font-weight: bold; line-height: 2;">哪間媒體、誰的媒體？</span>
此非新聞網站，無法提供相關資訊，如有錯誤歡迎到<a href="https://github.com/moon-jam/News-Traceability" target="_blank">本專案Github</a>回報。

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
                    }
                }
            });
        });
    }, 400); // Update every 1 second
});

chrome.storage.local.get('geminiApiKey', function(result) {
    if (!result.geminiApiKey) {
        if (confirm('請輸入Gemini API Key! 點擊 "OK" 以輸入。')) {
            chrome.runtime.openOptionsPage();
        }
    }
});