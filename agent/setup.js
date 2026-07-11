// setup.js — External script for Orion Agent Setup Window
// Loaded as external file to comply with CSP (no unsafe-inline needed)

(async function init() {
  try {
    // Load device info from main process via preload bridge
    const [hostname, version] = await Promise.all([
      window.electronAPI.getHostname(),
      window.electronAPI.getVersion()
    ]);

    const el = document.getElementById('deviceName');
    if (el) {
      el.textContent = hostname + '  ·  v' + version;
    }

    // Load auto-launch state
    const al = await window.electronAPI.getAutoLaunch();
    const checkbox = document.getElementById('autoLaunch');
    if (checkbox) {
      checkbox.checked = al.enabled;
    }
  } catch (err) {
    console.error('[Setup] Failed to load device info:', err);
    const el = document.getElementById('deviceName');
    if (el) el.textContent = 'This PC  ·  v1.0.0';
  }

  // Toggle password visibility
  const toggleBtn = document.getElementById('togglePassword');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function () {
      const input = document.getElementById('password');
      if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
      }
    });
  }

  // Form submit handler
  const form = document.getElementById('loginForm');
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');
      const autoLaunchInput = document.getElementById('autoLaunch');
      const btn = document.getElementById('loginBtn');
      const btnText = document.getElementById('btnText');
      const spinner = document.getElementById('btnSpinner');
      const errorBox = document.getElementById('errorBox');

      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';
      const autoLaunch = autoLaunchInput ? autoLaunchInput.checked : true;

      if (!email || !password) {
        if (errorBox) {
          errorBox.textContent = 'Please enter your email and password.';
          errorBox.style.display = 'flex';
        }
        return;
      }

      // Set loading state
      if (btn) btn.disabled = true;
      if (btnText) btnText.textContent = 'Connecting...';
      if (spinner) spinner.style.display = 'block';
      if (errorBox) errorBox.style.display = 'none';

      try {
        const result = await window.electronAPI.login({ email, password });

        if (result && result.success) {
          // Set auto-launch preference
          await window.electronAPI.setAutoLaunch(autoLaunch);

          if (btnText) btnText.textContent = '✓ Connected!';
          if (spinner) spinner.style.display = 'none';
          if (btn) btn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';

          setTimeout(function () {
            document.body.innerHTML =
              '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;gap:20px;text-align:center;padding:32px;font-family:Inter,system-ui,sans-serif;">' +
              '<div style="width:64px;height:64px;background:rgba(0,191,255,0.1);border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid rgba(0,191,255,0.3);">' +
              '<svg viewBox="0 0 24 24" fill="none" width="32" height="32"><path d="M20 6L9 17l-5-5" stroke="#00BFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
              '</div>' +
              '<div>' +
              '<h2 style="font-size:20px;font-weight:700;color:#fff;margin:0 0 8px;">Device Connected!</h2>' +
              '<p style="color:#94a3b8;font-size:14px;margin:0;line-height:1.6;">This PC is now visible in your<br>Orion dashboard. Running in tray.</p>' +
              '</div>' +
              '</div>';
          }, 1400);
        } else {
          const msg = (result && result.error) ? result.error : 'Login failed. Check your credentials.';
          if (errorBox) {
            errorBox.textContent = msg;
            errorBox.style.display = 'flex';
          }
          if (btn) btn.disabled = false;
          if (btnText) btnText.textContent = 'Connect Device';
          if (spinner) spinner.style.display = 'none';
        }
      } catch (err) {
        if (errorBox) {
          errorBox.textContent = 'Connection error. Please try again.';
          errorBox.style.display = 'flex';
        }
        if (btn) btn.disabled = false;
        if (btnText) btnText.textContent = 'Connect Device';
        if (spinner) spinner.style.display = 'none';
      }
    });
  }
})();
