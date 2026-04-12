document.addEventListener('DOMContentLoaded', async () => {
  const enabledCheckbox = document.getElementById('enabled');
  const themeSelect = document.getElementById('theme');
  const saveBtn = document.getElementById('saveBtn');
  const status = document.getElementById('status');

  const settings = await chrome.storage.sync.get(['enabled', 'theme']);
  enabledCheckbox.checked = settings.enabled ?? true;
  themeSelect.value = settings.theme ?? 'light';

  saveBtn.addEventListener('click', async () => {
    await chrome.storage.sync.set({
      enabled: enabledCheckbox.checked,
      theme: themeSelect.value
    });

    status.textContent = 'Settings saved!';
    status.classList.add('visible');

    setTimeout(() => {
      status.classList.remove('visible');
    }, 2000);
  });
});
