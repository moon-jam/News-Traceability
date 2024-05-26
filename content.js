let isEnabled = false;
let still_loading = false;

chrome.storage.local.get('isEnabled', function(data) {
    isEnabled = data.isEnabled;
    console.log("is enabled:", isEnabled);
    if(!isEnabled) return;
    generateTraceability();
    let targetNode = document.querySelector('title');
    let config = { childList: true, subtree: true, characterData: true };
    let previousTitle = document.title;

    let callback = function(mutationsList, observer) {
        if (document.title !== previousTitle) {
            previousTitle = document.title;
            console.log('Title changed:', document.title);
            generateTraceability();
        }
    };

    let observer = new MutationObserver(callback);
    observer.observe(targetNode, config);
});

let content = "";
let cert = 0;

let generateTraceability = function() {

    let bodyText = document.body.innerText;
    // console.log("Body text:", bodyText);
    chrome.runtime.sendMessage({websiteContent: bodyText});

    const h1Elements = document.querySelectorAll('h1');

    // 選擇所有字體大小大於 27px 的元素
    // 因為有些新聞網站標題沒有用 h1 標籤, ex: the reporter
    const largeFontElements = Array.from(document.querySelectorAll('body *')).filter(element => {
        const fontSize = parseFloat(window.getComputedStyle(element).fontSize);
        return fontSize > 27; // 修改數字以符合需求
    });

    const combinedElements = Array.from(new Set([...h1Elements, ...largeFontElements]));

    console.log("Elements:", combinedElements);

    combinedElements.forEach(element => {
        element.style.position = 'relative'; 

        element.addEventListener('mouseover', function() {
            if(!document.getElementById('tooltipIframe-yyds1234')){
                let iframe = document.createElement('iframe');
                iframe.id = 'tooltipIframe-yyds1234';
                iframe.style.cssText = `
                    all: initial;
                    position: absolute;
                    visibility: visible;
                    width: 600px;
                    height: 400px;
                    left: ${element.getBoundingClientRect().left}px;
                    top: ${element.getBoundingClientRect().bottom + window.scrollY}px;
                    z-index: 2147483647;
                    border: none;
                `;
                document.body.appendChild(iframe);
            }
        });

        element.addEventListener('mouseout', function() {
            timeoutId = setTimeout(function() {
                const tooltips = document.querySelectorAll('#tooltipIframe-yyds1234');
                console.log("Tooltips:", tooltips);
                tooltips.forEach(function(tooltip) {
                    if (!tooltip.matches(':hover')) {
                        tooltip.remove();
                        console.log("Tooltip removed");
                    }
                });
            }, 100);
        });
    });
};

let dots = '.';
let intervalId = setInterval(function() {
    dots = (dots.length < 3) ? (dots + '.') : '.';
    let currentUrl = location.href;
    // console.log("Current URL:", currentUrl);

    chrome.storage.local.get(currentUrl, function(result) {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            return;
        }
        let info = result[currentUrl];
        // console.log("Information for", currentUrl + ":", info);
        if (info) {
            content = 
                `<link href="https://fonts.googleapis.com/css2?family=Noto+Sans&display=swap" rel="stylesheet">
                <div style="font-family: \'Noto Sans\', sans-serif; background-color: white; padding: 5px; border: 1px solid black;">
                    <div style="text-align: center; margin-bottom: 10px;">
                        <span style="font-size: 24px; font-weight: bold; line-height: 2;"><a href="https://github.com/moon-jam/News-Traceability" target="_blank">新聞產銷履歷</a></span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="flex: 1; padding: 10px; border-right: 1px solid #ccc;">
                            <span style="font-size: 20px; font-weight: bold; line-height: 2;">哪間媒體、誰的媒體？</span><br>
                            媒體名稱: ${info.media ? info.media.name.replace(/\n/g, '<br>') : "Processing" + dots}<br>
                            所屬公司: ${info.media ? info.media.company.replace(/\n/g, '<br>') : "Processing" + dots}<br>
                            上線日期: ${info.media ? info.media.date.replace(/\n/g, '<br>') : "Processing" + dots}<br>
                            相關訊息: ${info.media ? info.media.content.replace(/\n/g, '<br>') : "Processing" + dots}<br>
                            可信度分數: ${info.media ? info.media.score.replace(/\n/g, '<br>') : "Processing" + dots}<br>
                            <br>
                            <span style="font-size: 20px; font-weight: bold; line-height: 2;">誰寫的報導？</span><br>
                            ${info.author ? info.author.replace(/\n/g, '<br>') : "Processing" + dots}<br>
                            <br>
                            <span style="font-size: 20px; font-weight: bold; line-height: 2;">誰給的消息？</span><br>
                            ${info.source ? info.source.replace(/\n/g, '<br>') : "Processing" + dots}
                        </div>
                        <div style="flex: 1; padding: 10px;">
                            <span style="font-size: 20px; font-weight: bold; line-height: 2;">何時的新聞？</span><br>
                            ${info.when ? info.when.happen.replace(/\n/g, '<br>') : "Processing" + dots}<br>
                            ${info.when ? info.when.report.replace(/\n/g, '<br>') : "Processing" + dots}<br>
                            <br>
                            <span style="font-size: 20px; font-weight: bold; line-height: 2;">哪裡的新聞？</span><br>
                            ${info.where ? info.where.replace(/\n/g, '<br>') : "Processing" + dots}<br>
                            <br>
                            <span style="font-size: 20px; font-weight: bold; line-height: 2;">是否煽動閱聽人情緒？</span><br>
                            ${info.emotion ? info.emotion.replace(/\n/g, '<br>') : "Processing" + dots}
                        </div>
                    </div>
                    <div style="margin-bottom: 0.5em;"></div>
                    <button id="regenerate-button-yyds1234" style="width: 100%;">重新生成新聞履歷</button>
                </div>`;   
                if(info.author) still_loading = false;
        } else {
            content = 
                `<link href="https://fonts.googleapis.com/css2?family=Noto+Sans&display=swap" rel="stylesheet">
                <div style="font-family: \'Noto Sans\', sans-serif; background-color: white; padding: 5px; border: 1px solid black;">
                    <span style="font-size: 20px; font-weight: bold; line-height: 2;">並非新聞網站</span><br><br><br><br><br><br><br><br><br><br>
                </div>`;
            still_loading = false;
        }   
    });

    let existingIframe = document.getElementById('tooltipIframe-yyds1234');
    if(existingIframe){
        let doc = existingIframe.contentDocument || existingIframe.contentWindow.document;
        doc.body.innerHTML = content; 
        if(cert == 1)
            existingIframe.style.backgroundColor = 'rgba(0, 200, 0, 0.2)';
        else if(cert == -1)
            existingIframe.style.backgroundColor = 'rgba(200, 0, 0, 0.2)';
        else existingIframe.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
        // console.log(cert, existingIframe.style.backgroundColor);
        doc.body.onmouseleave = function() {
            const tooltips = document.querySelectorAll('#tooltipIframe-yyds1234');
            tooltips.forEach(function(tooltip) {
                tooltip.remove();
            });
            console.log("Tooltip iframe removed because mouse left the iframe.");
        };

        const regenerateButton = doc.getElementById('regenerate-button-yyds1234');
        regenerateButton.addEventListener('click', function() {
            if(still_loading) return;
            still_loading = true;
            if(isEnabled) generateTraceability();
        });
    }
}, 400);

// // due to something strange, it is not working
// chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
//     if (message.getWebsiteContent) {
//         console.log("Content received:", message);
//         let bodyText = document.body.innerText;
//         sendResponse ({websiteContent: bodyText});
//     }
// });

setInterval(function() {
    chrome.storage.local.get('regenerate', function(data) {
        if(data.regenerate){
            console.log("Regenerate!");
            chrome.storage.local.set({ regenerate: false });
            if(still_loading) return;
            still_loading = true;
            if(isEnabled) generateTraceability();
        }
    });
}, 100); 
