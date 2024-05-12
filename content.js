chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === "DISPLAY_RESULTS") {
        // 在頁面上顯示數據
        displayResultsOnPage(request.data);
    }
});

function displayResultsOnPage(data) {
    const resultsDiv = document.createElement('div');
    resultsDiv.style.position = 'fixed';
    resultsDiv.style.bottom = '10px';
    resultsDiv.style.right = '10px';
    resultsDiv.style.backgroundColor = 'white';
    resultsDiv.innerText = `真實性：${data.truthfulness}, 知識含量：${data.knowledge}`;
    document.body.appendChild(resultsDiv);
}
