chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        chrome.runtime.openOptionsPage();
    }
});  

async function getCurrentTabUrl() {
    return new Promise((resolve, reject) => {
        chrome.windows.getLastFocused({ populate: true }, (window) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                const activeTab = window.tabs.find(tab => tab.active);
                resolve(activeTab.url);
            }
        });
    });
}

function generateMediaInfo() {
    getCurrentTabUrl().then(async (url) => {
        if(!url){
            setTimeout(generateMediaInfo, 500);
            console.log('No URL found, retrying...', url);
            return;
        }
        let fullUrl = url;
        let urlObj = new URL(fullUrl);
        let domain = urlObj.hostname.replace("www.", "");
        let fileURL = 'https://raw.githubusercontent.com/moon-jam/News-Traceability/main/database/brand-info.json';
        let certFileURL = 'https://raw.githubusercontent.com/moon-jam/News-Traceability/main/database/brand-certification.json';

        fetch(fileURL)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(brandInfo => {
                let brand_info = brandInfo[domain];
                if (brand_info) {
                    fetch(certFileURL)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }
                            return response.json();
                        })
                        .then(certInfo => {
                            let cert = certInfo[brand_info.name] || "normal";
                            chrome.storage.local.get(fullUrl, function(result) {
                                if (result[fullUrl] && result[fullUrl].media) {
                                    console.log('Search information already exists, not updating.');
                                } else {
                                    let news_info = {};
                                    news_info[fullUrl] = {"media": {...brand_info, cert: cert}};
                                    console.log("Information for", fullUrl + ":", news_info);

                                    chrome.storage.local.set(news_info, function() {
                                        console.log('Search information saved.');
                                    });
                                }
                            });
                        })
                        .catch(error => {
                            console.error('Failed to load brand-certification.json', error);
                        });
                } else {
                    console.log("No brand information found for", domain);
                }
            })
            .catch(error => {
                console.error('Failed to load brand-info.json', error);
            });
    });
}

function processGeminiInfo(data) {
    data = JSON.parse(data); // 將字串轉換為 JSON 陣列
    data = data.map(line => {
        line = String(line).trim();
        let match = line.match(/([✅❌])/g);
        if (match && match.length > 0) {
            line = line.replace(/([✅❌])/g, ''); 
            return match[0] + ' ' + line; 
        } else {
            return line;
        }
    });
    let info = {
        "author": data[0], 
        "where": data[1], 
        "when": {
            "report": data[2],
            "happen": data[3] 
        },
        "source": data[4],
        "emotion": data[5]
    };

    return info;
}


chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if(!message.websiteContent) return;
    generateMediaInfo();
    getCurrentTabUrl().then(url => {
        let fullUrl = url;
        chrome.storage.local.get(fullUrl, async function(result) {
            let info = result[fullUrl];
            // console.log("ori information for", fullUrl + ":", info);
            if(info){
                let media = info.media;
                // console.log("process information for", fullUrl + ":", media);
                let dataToSave = {};
                dataToSave[fullUrl] = {media};
                // console.log("clear information for", fullUrl + ":", dataToSave);
                chrome.storage.local.set(dataToSave, async function() {
                    console.log('clear api info.');
                });
            }
        });
    });
    
    let websiteContent = "";
    websiteContent = message.websiteContent;
    let response = await fetch(chrome.runtime.getURL('prompt.txt'));
    let promptText = await response.text();
    let query = `${promptText}\n${websiteContent}\n}}`;

    chrome.storage.local.get('geminiApiKey', async function(result) {
        apiKey = result.geminiApiKey;
        // let res = sendMessage(apiKey, query);
        // if(!res.error) console.log(res.message);
    
        const modelId = "gemini-1.5-flash-latest";
    
        if (query && apiKey) {
            getCurrentTabUrl().then(async url => {
                let fullUrl = url;
                // console.log("HAHA ", query, fullUrl);
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-goog-api-key": apiKey,
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ 
                                text: query
                            }],
                            role: "user"
                        }],
                        safetySettings: [
                            {
                                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                                threshold: "BLOCK_NONE"
                            },
                            {
                                category: "HARM_CATEGORY_HATE_SPEECH",
                                threshold: "BLOCK_NONE"
                            },
                            {
                                category: "HARM_CATEGORY_HARASSMENT",
                                threshold: "BLOCK_NONE"
                            },
                            {
                                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                                threshold: "BLOCK_NONE"
                            }
                        ],
                        generationConfig: {
                            "temperature": 0.3,
                            "responseMimeType": "application/json",
                            // "stopSequences": [ "}}" ]
                        }
                    })
                });
        
                if (response.ok) {
                    const data = await response.text();
                    const dataObj = JSON.parse(data);
                    if (dataObj && dataObj.candidates && dataObj.candidates[0] && dataObj.candidates[0].content && dataObj.candidates[0].content.parts && dataObj.candidates[0].content.parts[0]) {
                        const text = dataObj.candidates[0].content.parts[0].text;
                        console.log(text);

                        content_info = processGeminiInfo(text);
                        for (let key in content_info) {
                            if (content_info[key] && typeof content_info[key] === "string")
                                content_info[key] = sanitizeHTML(content_info[key]);
                            else 
                                for (let subkey in content_info[key]) {
                                    if (content_info[key][subkey] && typeof content_info[key][subkey] === "string")
                                        content_info[key][subkey] = sanitizeHTML(content_info[key][subkey]);
                                }
                        }
                        console.log(content_info);
                        
                        chrome.storage.local.get(fullUrl, async function(result) {
                            let info = result[fullUrl];
                            info = {...info, ...content_info};
                            let dataToSave = {};
                            dataToSave[fullUrl] = info;
                            console.log("Include api information for", fullUrl + ":", dataToSave);
                            chrome.storage.local.set(dataToSave, async function() {
                                console.log('Search information saved.');
                            });
                        });
                    }
                } else {
                    console.log('Generate Error');
                    console.log(response);
                }
            });
        } else {
            console.log("Please enter your API key in the options page.");
            return 'Please enter your API key in the options page.';
        }
    });
});

function sanitizeHTML(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
