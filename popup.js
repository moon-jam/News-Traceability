const inputText = document.getElementById('input-text');
const sendButton = document.getElementById('send-button');
const outputText = document.getElementById('output-text');

const apiKey = localStorage.getItem('geminiApiKey');
const modelId = "gemini-1.0-pro";

sendButton.addEventListener('click', async () => {
    const query = inputText.value.trim();
    if (query && apiKey) {
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

        console.log(response);

        // let response_content = "";
        if (response.ok) {
            const data = await response.text();
            const dataObj = JSON.parse(data);
            if (dataObj && dataObj.candidates && dataObj.candidates[0] && dataObj.candidates[0].content && dataObj.candidates[0].content.parts && dataObj.candidates[0].content.parts[0]) {
                const text = dataObj.candidates[0].content.parts[0].text;
                outputText.textContent = text;
            }
        } else {
            outputText.textContent = 'Error';
        }
    } else {
        console.log("Please enter your API key in the options page.");
        alert('Please enter your API key in the options page.');
    }
});
