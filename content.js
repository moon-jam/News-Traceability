let bodyText = document.body.innerText;
chrome.runtime.sendMessage({websiteContent: bodyText});

// due to something strange, it is not working
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.getWebsiteContent) {
        console.log("Content received:", message);
        let bodyText = document.body.innerText;
        sendResponse ({websiteContent: bodyText});
    }
});