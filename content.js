// Load Tesseract.js dynamically in content script
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@2.1.1/dist/tesseract.min.js';
script.onload = () => {
    document.addEventListener('mousedown', startSelection);

    function startSelection(event) {
        const selection = document.createElement('div');
        selection.id = 'selection-box';
        selection.style.position = 'absolute';
        selection.style.border = '2px dashed #000';
        document.body.appendChild(selection);

        let startX = event.clientX;
        let startY = event.clientY;

        document.addEventListener('mousemove', resizeSelection);
        document.addEventListener('mouseup', finishSelection);

        function resizeSelection(event) {
            const width = event.clientX - startX;
            const height = event.clientY - startY;
            selection.style.left = `${startX}px`;
            selection.style.top = `${startY}px`;
            selection.style.width = `${width}px`;
            selection.style.height = `${height}px`;
        }

        function finishSelection(event) {
            document.removeEventListener('mousemove', resizeSelection);
            document.removeEventListener('mouseup', finishSelection);

            const rect = selection.getBoundingClientRect();
            chrome.runtime.sendMessage({ action: 'capture', rect });
            document.body.removeChild(selection);
        }
    }
};

document.head.appendChild(script);

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === 'process-image') {
        const { dataUrl, rect } = message;
        const croppedImage = await cropImage(dataUrl, rect);
        const text = await performOCR(croppedImage);
        chrome.runtime.sendMessage({ action: 'ocr-result', text });
    }
});

async function performOCR(imageData) {
    const worker = Tesseract.createWorker();
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');

    const { data: { text } } = await worker.recognize(imageData);
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
