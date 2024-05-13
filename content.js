let bodyText = document.body.innerText;
chrome.runtime.sendMessage({websiteContent: bodyText});

