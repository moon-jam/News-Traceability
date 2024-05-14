window.onload = function() {
    let bodyText = document.body.innerText;
    chrome.runtime.sendMessage({websiteContent: bodyText});
};

// due to something strange, it is not working
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.getWebsiteContent) {
        console.log("Content received:", message);
        let bodyText = document.body.innerText;
        sendResponse ({websiteContent: bodyText});
    }
});

document.querySelectorAll('h1').forEach(element => {
    element.style.position = 'relative';  // 確保提示框能正確顯示

    element.addEventListener('mouseover', function() {
        const tooltip = document.createElement('div');
        tooltip.id = 'tooltip-55523ij4SASASasdaßß∂ßåπçßßßß∑∑∑∑';
        tooltip.style.position = 'absolute';
        tooltip.style.zIndex = '1000';
        tooltip.style.width = 'auto';
        tooltip.style.height = 'auto';
        tooltip.style.padding = '5px';
        tooltip.style.border = '1px solid black';
        tooltip.style.left = '0px';
        tooltip.style.backgroundColor = 'white';
        tooltip.style.fontSize = '14px';

        let dots = '';
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
                    tooltip.innerHTML = 
`<div style="text-align: center; margin-bottom: 10px;">
    <span style="font-size: 24px; font-weight: bold; line-height: 2;"><a href="https://github.com/moon-jam/News-Traceability" target="_blank">新聞產銷履歷</a></span>
</div>
<div style="display: flex; justify-content: space-between; align-items: flex-start;">
    <div style="flex: 1; padding: 10px; border-right: 1px solid #ccc;">
        <span style="font-size: 20px; font-weight: bold; line-height: 2;">哪間媒體、誰的媒體？</span><br>
        媒體名稱: ${info.media ? info.media.name : "Processing" + dots}<br>
        所屬公司: ${info.media ? info.media.company : "Processing" + dots}<br>
        上線日期: ${info.media ? info.media.date : "Processing" + dots}<br>
        相關訊息: ${info.media ? info.media.content : "Processing" + dots}<br>
        可信度分數: ${info.media ? info.media.score : "Processing" + dots}<br>
        <br>
        <span style="font-size: 20px; font-weight: bold; line-height: 2;">誰寫的報導？</span><br>
        ${info.author ? info.author : "Processing" + dots}<br>
        <br>
        <span style="font-size: 20px; font-weight: bold; line-height: 2;">誰給的消息？</span><br>
        ${info.source ? info.source : "Processing" + dots}
    </div>
    <div style="flex: 1; padding: 10px;">
        <span style="font-size: 20px; font-weight: bold; line-height: 2;">何時的新聞？</span><br>
        ${info.when ? info.when.happen : "Processing" + dots}<br>
        ${info.when ? info.when.report : "Processing" + dots}<br>
        <br>
        <span style="font-size: 20px; font-weight: bold; line-height: 2;">哪裡的新聞？</span><br>
        ${info.where ? info.where : "Processing" + dots}<br>
        <br>
        <span style="font-size: 20px; font-weight: bold; line-height: 2;">是否煽動閱聽人情緒？</span><br>
        ${info.emotion ? info.emotion : "Processing" + dots}
    </div>
</div>`;
;                    
                } else {
                    tooltip.innerText = '並非新聞網站';
                }
            });
        }, 400);

        element.appendChild(tooltip);

    });

    element.addEventListener('mouseout', function() {
        timeoutId = setTimeout(function() {
            const tooltips = document.querySelectorAll('#tooltip-55523ij4SASASasdaßß∂ßåπçßßßß∑∑∑∑');
            tooltips.forEach(function(tooltip) {
                if (!tooltip.matches(':hover')) {
                    tooltip.remove();
                    console.log("Tooltip removed");
                }
            });
        }, 100);
    });
});
