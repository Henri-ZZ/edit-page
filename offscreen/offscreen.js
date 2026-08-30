let stitchState = null;

const loadImage = (src) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('Unable to decode screenshot segment'));
  image.src = src;
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message.type?.startsWith('EDIT_PAGE_STITCH_')) return false;

  (async () => {
    if (message.type === 'EDIT_PAGE_STITCH_START') {
      const maxCanvasEdge = 30000;
      const outputScale = Math.min(
        message.dpr || 1,
        maxCanvasEdge / message.width,
        maxCanvasEdge / message.height
      );
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(message.width * outputScale));
      canvas.height = Math.max(1, Math.round(message.height * outputScale));
      stitchState = {
        canvas,
        context: canvas.getContext('2d'),
        outputScale
      };
      sendResponse({ ok: true });
      return;
    }

    if (!stitchState) throw new Error('Screenshot stitcher is not initialized');

    if (message.type === 'EDIT_PAGE_STITCH_ADD') {
      const image = await loadImage(message.dataUrl);
      const sourceScale = image.naturalWidth / message.viewportWidth;
      const { context, outputScale } = stitchState;
      context.drawImage(
        image,
        0,
        Math.round(message.sourceY * sourceScale),
        image.naturalWidth,
        Math.round(message.height * sourceScale),
        0,
        Math.round(message.y * outputScale),
        Math.round(message.viewportWidth * outputScale),
        Math.round(message.height * outputScale)
      );
      sendResponse({ ok: true });
      return;
    }

    if (message.type === 'EDIT_PAGE_STITCH_FINISH') {
      const dataUrl = stitchState.canvas.toDataURL('image/png');
      stitchState = null;
      sendResponse({ ok: true, dataUrl });
    }
  })().catch((error) => {
    stitchState = null;
    sendResponse({ ok: false, error: error.message });
  });

  return true;
});
