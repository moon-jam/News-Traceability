// let { sendMessage } = require('llm.js');

async function getActiveTabUrl() {
    const tabs = await chrome.tabs.query({ active: true });
    return tabs[0].url;
}

chrome.webNavigation.onCompleted.addListener(function(details) {
    getActiveTabUrl().then(url => {
        let fullUrl = url;
        let urlObj = new URL(fullUrl);
        let domain = urlObj.hostname.replace("www.", "");
        let fileURL = chrome.runtime.getURL('database/brand-info.json');
    
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
                    // let content_info = processGeminiInfo(generateContent(combineContentWithPrompt()));
                    chrome.storage.local.get(fullUrl, function(result) {
                        if (result[fullUrl] && result[fullUrl].media) {
                            console.log('Search information already exists, not updating.');
                        } else {
                            let news_info = {};
                            news_info[fullUrl] = {"media":brand_info};
                            console.log("Information for", fullUrl + ":", news_info);
                            
                            chrome.storage.local.set(news_info, function() {
                                console.log('Search information saved.');
                            });
                        }
                    });
                } else {
                    console.log("No brand information found for", domain);
                }
            })
            .catch(error => {
                console.error('Failed to load brand-info.json', error);
            });
    });

}, {url: [{schemes: ['http', 'https']}]});

function processGeminiInfo(data) {
    data = JSON.parse(data); // 將字串轉換為 JSON 陣列
    data = data.map(line => {
        line = String(line).trim();
        return line.replace(/([\s\S]*)([✅❌])\s*(.*)$/, '$2 $1$3');
    });
    let info = {
        "author": data[0], 
        "where": data[1], 
        "when": {
            "happen": data[2], 
            "report": data[3]
        },
        "source": data[4],
        "emotion": data[5]
    };

    return info;
}


chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if(!message.websiteContent) return;
    getActiveTabUrl().then(url => {
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
            getActiveTabUrl().then(async url => {
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
                            "temperature": 1,
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
