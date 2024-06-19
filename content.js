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
