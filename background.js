chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'capture') {
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
            // Send image data to content script for OCR processing
            chrome.tabs.sendMessage(sender.tab.id, { action: 'process-image', dataUrl, rect: message.rect });
        });
    }

    if (message.action === 'ocr-result') {
        // Process the OCR result with OpenAI API
        fetchChatGPT(message.text)
            .then(response => {
                chrome.tabs.sendMessage(sender.tab.id, { action: 'display', response });
            })
            .catch(error => {
                console.error('Error fetching response from ChatGPT:', error);
                chrome.tabs.sendMessage(sender.tab.id, { action: 'display', response: 'Error fetching response from ChatGPT' });
            });
    }
});

async function fetchChatGPT(question) {
    const apiKey = 'sk-proj-JmD0urfjYzeYtZBrTTPtT3BlbkFJ2NchtopFWpoOGueIRWlR';

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [
                    { "role": "system", "content": "You are a helpful assistant." },
                    { "role": "user", "content": question }
                ]
            })
        });

        const result = await response.json();
        if (result.choices && result.choices.length > 0) {
            return result.choices[0].message.content;
        } else {
            throw new Error('No response from OpenAI API');
        }
    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        throw error;
    }
}
