(() => {
  let isEditing = false;

  const clearEditPageState = () => {
    document.body.contentEditable = 'false';
    document.body.classList.remove('edit-page-editing');

    if (window._editPageClickHandler) {
      document.removeEventListener('click', window._editPageClickHandler, true);
      window._editPageClickHandler = null;
    }

    if (window._editPageBackupAttrs) {
      document.querySelectorAll('a[data-href-backup], area[data-href-backup]').forEach(el => {
        el.setAttribute('href', el.getAttribute('data-href-backup'));
        el.removeAttribute('data-href-backup');
      });
      window._editPageBackupAttrs = null;
    }

    if (window._editPageReplaceHandler) {
      document.removeEventListener('click', window._editPageReplaceHandler, true);
      document.removeEventListener('mousedown', window._editPageReplaceMouseDownHandler, true);
      window._editPageReplaceHandler = null;
      window._editPageReplaceMouseDownHandler = null;
      window._editPageReplaceImage = null;
      document.body.classList.remove('edit-page-replace-mode');
    }

    if (window._editPageRemoveClickHandler) {
      document.removeEventListener('click', window._editPageRemoveClickHandler, true);
      document.removeEventListener('mouseover', window._editPageRemoveOverHandler, true);
      document.removeEventListener('mouseout', window._editPageRemoveOutHandler, true);
      window._editPageRemoveClickHandler = null;
      window._editPageRemoveOverHandler = null;
      window._editPageRemoveOutHandler = null;
      document.querySelectorAll('.edit-page-remove-target').forEach((element) => {
        element.classList.remove('edit-page-remove-target');
      });
      document.body.classList.remove('edit-page-remove-mode');
    }
  };

  const toggleEditMode = () => {
    isEditing = !isEditing;
    document.body.contentEditable = isEditing;
    if (isEditing) {
      document.body.classList.add('edit-page-editing');
    } else {
      document.body.classList.remove('edit-page-editing');
    }
    return isEditing;
  };

  window.addEventListener('beforeunload', () => {
    clearEditPageState();
    chrome.runtime.sendMessage({ action: 'pageUnload' }).catch(() => {});
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getStatus') {
      sendResponse({ isEditing });
    } else if (request.action === 'toggleEdit') {
      const result = toggleEditMode();
      sendResponse({ isEditing: result });
    }
    return true;
  });
})();
