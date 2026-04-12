chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details.reason);

  if (details.reason === 'install') {
    chrome.storage.sync.set({
      enabled: true,
      theme: 'light'
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    sendResponse({ pong: true });
  } else if (request.action === 'pageUnload') {
    chrome.storage.local.remove('replaceImageData');
  }
  return true;
});
