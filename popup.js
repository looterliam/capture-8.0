document.getElementById('capture').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ['content.js']
        });
    });
});

chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'display') {
        document.getElementById('response').innerText = message.response;
    }
});
