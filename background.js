importScripts('libs/tesseract.min.js');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'capture') {
        chrome.tabs.captureVisibleTab(null, {format: 'png'}, (dataUrl) => {
            // Process the image data directly
            fetchChatGPT(dataUrl, message.rect)
                .then(response => {
                    chrome.tabs.sendMessage(sender.tab.id, {action: 'display', response});
                });
        });
    }
});

async function fetchChatGPT(imageData, rect) {
    // Extract text from the image using OCR
    const question = await extractTextFromImage(imageData, rect);

    // OpenAI API key
    const apiKey = 'sk-proj-JmD0urfjYzeYtZBrTTPtT3BlbkFJ2NchtopFWpoOGueIRWlR';

    // Call OpenAI API with the extracted question
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-4",
            messages: [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": question}
            ]
        })
    });

    const result = await response.json();
    return result.choices[0].message.content;
}

async function extractTextFromImage(imageData, rect) {
    // Load Tesseract.js worker
    const worker = Tesseract.createWorker();
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    // Crop the image to the selected area (rect) before sending it to the OCR
    const croppedImage = await cropImage(imageData, rect);
    const { data: { text } } = await worker.recognize(croppedImage);
    await worker.terminate();

    return text;
}

async function cropImage(imageData, rect) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = imageData;
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = rect.width;
            canvas.height = rect.height;
            
            ctx.drawImage(img, rect.left, rect.top, rect.width, rect.height, 0, 0, rect.width, rect.height);
            resolve(canvas.toDataURL('image/png'));
        };
    });
}
