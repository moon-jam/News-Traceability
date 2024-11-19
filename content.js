let isEnabled = false;
let still_loading = true;

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
let last_content = "";
let cert = "normal";

let generateTraceability = function() {
    still_loading = true;

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
            last_content = "";
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
            if (info.media) cert = info.media.cert;
        
            // 檢查是否需要重新渲染
            const newContent = JSON.stringify(info);
            if (last_content === newContent) return;
            last_content = newContent;
        
            if (still_loading) {
                let existingIframe = document.getElementById('tooltipIframe-yyds1234');
                if (existingIframe) {
                    let doc = existingIframe.contentDocument || existingIframe.contentWindow.document;
        
                    // 清空 iframe 的內容
                    doc.body.innerHTML = '';
        
                    // 創建主容器
                    const container = document.createElement('div');
                    container.style.cssText = "font-family: 'Noto Sans', sans-serif; background-color: white; padding: 5px; border: 1px solid black;";
        
                    // 標題區域
                    const header = document.createElement('div');
                    header.style.textAlign = 'center';
                    header.style.marginBottom = '10px';
        
                    const title = document.createElement('span');
                    title.style.cssText = "font-size: 24px; font-weight: bold; line-height: 2;";
                    const link = document.createElement('a');
                    link.href = "https://github.com/moon-jam/News-Traceability#新聞產銷履歷";
                    link.target = "_blank";
                    link.textContent = "新聞產銷履歷 - 簡介及使用說明";
                    title.appendChild(link);
                    header.appendChild(title);
                    container.appendChild(header);
        
                    // 主內容區域（左右兩邊）
                    const mainContent = document.createElement('div');
                    mainContent.style.cssText = "display: flex; justify-content: space-between; align-items: flex-start;";
        
                    // 左側內容：媒體資訊、作者、來源
                    const leftContent = document.createElement('div');
                    leftContent.style.cssText = "flex: 1; padding: 10px; border-right: 1px solid #ccc;";
        
                    const mediaTitle = document.createElement('span');
                    mediaTitle.style.cssText = "font-size: 20px; font-weight: bold; line-height: 2;";
                    mediaTitle.textContent = "哪間媒體、誰的媒體？";
                    leftContent.appendChild(mediaTitle);
                    leftContent.appendChild(document.createElement('br'));
        
                    if (info.media) {
                        const mediaName = document.createElement('div');
                        mediaName.textContent = `媒體名稱: ${info.media.name || "Processing" + dots}`;
                        leftContent.appendChild(mediaName);
        
                        const companyName = document.createElement('div');
                        companyName.textContent = `所屬公司: ${info.media.company || "Processing" + dots}`;
                        leftContent.appendChild(companyName);
        
                        const date = document.createElement('div');
                        date.textContent = `上線日期: ${info.media.date || "Processing" + dots}`;
                        leftContent.appendChild(date);
        
                        const content = document.createElement('div');
                        content.textContent = `相關訊息: ${info.media.content || "Processing" + dots}`;
                        leftContent.appendChild(content);
        
                        const credibilityLink = document.createElement('a');
                        credibilityLink.href = "https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2023/taiwan";
                        credibilityLink.target = "_blank";
                        credibilityLink.textContent = "可信度分數";
                        leftContent.appendChild(credibilityLink);
                    } else {
                        const warning = document.createElement('div');
                        warning.textContent = "此非新聞網站，無法提供相關資訊，如有錯誤歡迎到";
                        const warningLink = document.createElement('a');
                        warningLink.href = "https://github.com/moon-jam/News-Traceability";
                        warningLink.target = "_blank";
                        warningLink.textContent = "本專案Github";
                        warning.appendChild(warningLink);
                        warning.append("回報。");
                        leftContent.appendChild(warning);
                    }
        
                    const authorInfo = document.createElement('div');
                    authorInfo.style.cssText = "font-size: 20px; font-weight: bold; line-height: 2;";
                    authorInfo.textContent = "誰寫的報導？";
                    leftContent.appendChild(authorInfo);
        
                    const authorDetails = document.createElement('div');
                    authorDetails.textContent = info.author || "Processing" + dots;
                    leftContent.appendChild(authorDetails);
        
                    const sourceInfo = document.createElement('div');
                    sourceInfo.style.cssText = "font-size: 20px; font-weight: bold; line-height: 2;";
                    sourceInfo.textContent = "誰給的消息？";
                    leftContent.appendChild(sourceInfo);
        
                    const sourceDetails = document.createElement('div');
                    sourceDetails.textContent = info.source || "Processing" + dots;
                    leftContent.appendChild(sourceDetails);
        
                    mainContent.appendChild(leftContent);
        
                    // 右側內容：其他資訊
                    const rightContent = document.createElement('div');
                    rightContent.style.cssText = "flex: 1; padding: 10px;";
        
                    const timeInfo = document.createElement('div');
                    timeInfo.style.cssText = "font-size: 20px; font-weight: bold; line-height: 2;";
                    timeInfo.textContent = "何時的新聞？";
                    rightContent.appendChild(timeInfo);
        
                    const timeDetails = document.createElement('div');
                    timeDetails.textContent = info.when
                        ? `${info.when.happen || "Processing" + dots} ${info.when.report || "Processing" + dots}`
                        : "Processing" + dots;
                    rightContent.appendChild(timeDetails);
        
                    const locationInfo = document.createElement('div');
                    locationInfo.style.cssText = "font-size: 20px; font-weight: bold; line-height: 2;";
                    locationInfo.textContent = "哪裡的新聞？";
                    rightContent.appendChild(locationInfo);
        
                    const locationDetails = document.createElement('div');
                    locationDetails.textContent = info.where || "Processing" + dots;
                    rightContent.appendChild(locationDetails);
        
                    const emotionInfo = document.createElement('div');
                    emotionInfo.style.cssText = "font-size: 20px; font-weight: bold; line-height: 2;";
                    emotionInfo.textContent = "是否煽動閱聽人情緒？";
                    rightContent.appendChild(emotionInfo);
        
                    const emotionDetails = document.createElement('div');
                    emotionDetails.textContent = info.emotion || "Processing" + dots;
                    rightContent.appendChild(emotionDetails);
        
                    mainContent.appendChild(rightContent);
                    container.appendChild(mainContent);
        
                    // 生成按鈕
                    const regenerateButton = document.createElement('button');
                    regenerateButton.id = "regenerate-button-yyds1234";
                    regenerateButton.style.width = '100%';
                    regenerateButton.textContent = "重新生成新聞履歷";
                    regenerateButton.addEventListener('click', function () {
                        if (still_loading) return;
                        still_loading = true;
                        if (isEnabled) generateTraceability();
                    });
                    container.appendChild(regenerateButton);
        
                    // 插入到 iframe
                    doc.body.appendChild(container);
        
                    // 更新背景色
                    existingIframe.style.backgroundColor =
                        cert === "good"
                            ? 'rgba(0, 200, 0, 0.2)'
                            : cert === "bad"
                            ? 'rgba(200, 0, 0, 0.5)'
                            : 'rgba(0, 0, 0, 0.2)';
        
                    // 添加事件
                    doc.body.onmouseleave = function () {
                        const tooltips = document.querySelectorAll('#tooltipIframe-yyds1234');
                        tooltips.forEach(function (tooltip) {
                            tooltip.remove();
                        });
                        console.log("Tooltip iframe removed because mouse left the iframe.");
                    };
                }
            }
        }
    });
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
    chrome.storage.local.get('regenerate', async function(data) {
        if(data.regenerate){
            console.log("Regenerate!");
            chrome.storage.local.set({ regenerate: false });
            if(still_loading) return;
            still_loading = true;
            chrome.storage.local.get('isEnabled', function(data) {
                console.log("is enabled:", data.isEnabled);
                isEnabled = data.isEnabled;
                if(isEnabled) generateTraceability();
            });
        }
    });
}, 100); 
