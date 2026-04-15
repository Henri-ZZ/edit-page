chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    sendResponse({ pong: true });
  } else if (request.action === 'pageUnload') {
    chrome.storage.local.remove('replaceImageData');
  }
  return true;
});
