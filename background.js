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
                        if (!result[fullUrl]) {
                            let news_info = {};
                            news_info[fullUrl] = {"media":brand_info};
                            console.log("Information for", fullUrl + ":", news_info);
                            
                            chrome.storage.local.set(news_info, function() {
                                console.log('Search information saved.');
                            });
                        } else {
                            console.log('Search information already exists, not updating.');
                        }
                    });
                } else {
                    console.log("No brand information found for", fullUrl);
                }
            })
            .catch(error => {
                console.error('Failed to load brand-info.json', error);
            });
    });

}, {url: [{schemes: ['http', 'https']}]});

function processGeminiInfo(data) {
    data = data.replace(/(\{\{\n|\n\}\})/g, '');
    data = data.replace(/\n{2,}/g, '\n');
    let lines = data.split('\n');
    let info = {
        "author": lines[0], 
        "where": lines[1], 
        "when": {
            "happen": lines[2], 
            "report": lines[3]
        },
        "source": lines[4],
        "emotion": lines[5]
    };

    return info;
}


chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    let websiteContent = "";
    websiteContent = message.websiteContent;
    let response = await fetch(chrome.runtime.getURL('prompt.txt'));
    let promptText = await response.text();
    let query = `${promptText.trim()}\n${websiteContent.trim()}\n}}`;

    chrome.storage.local.get('geminiApiKey', async function(result) {
        apiKey = result.geminiApiKey;
    
        const modelId = "gemini-1.0-pro";
    
        if (query && apiKey) {
            // console.log("HAHA ", query, apiKey);
            const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${modelId}:generateContent`, {
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
                    safetySettings: [{
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
                    }]
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

                    getActiveTabUrl().then(url => {
                        let fullUrl = url;
                    
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
                    });
                }
            } else {
                console.log('Generate Error');
            }
        } else {
            console.log("Please enter your API key in the options page.");
            return 'Please enter your API key in the options page.';
        }
    });
});
