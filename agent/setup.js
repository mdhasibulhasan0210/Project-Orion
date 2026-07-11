// setup.js — Orion Agent Setup Window
// Runs in renderer process via contextBridge (sandbox:false, contextIsolation:true)

(function init() {
  // ── Defensive API check ──────────────────────────────────────────────
  // If preload didn't load, show an error rather than silent failure
  if (!window.electronAPI) {
    console.error('[Setup] electronAPI not available — preload may have failed');
    var deviceEl = document.getElementById('deviceName');
    if (deviceEl) deviceEl.textContent = 'Preload error — restart app';
    return;
  }

  const api = window.electronAPI;

  // ── Load device info ─────────────────────────────────────────────────
  Promise.all([api.getHostname(), api.getVersion()])
    .then(function(results) {
      var hostname = results[0];
      var version  = results[1];
      var el = document.getElementById('deviceName');
      if (el) el.textContent = (hostname || 'This PC') + '  ·  v' + (version || '1.0.0');
    })
    .catch(function(err) {
      console.error('[Setup] Failed to load device info:', err);
      var el = document.getElementById('deviceName');
      if (el) el.textContent = 'This PC  ·  v1.0.0';
    });

  // ── Load auto-launch state ───────────────────────────────────────────
  api.getAutoLaunch()
    .then(function(result) {
      var checkbox = document.getElementById('autoLaunch');
      if (checkbox) checkbox.checked = !!(result && result.enabled);
    })
    .catch(function() { /* default stays checked */ });

  // ── Toggle password visibility ───────────────────────────────────────
  var toggleBtn = document.getElementById('togglePassword');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function() {
      var input = document.getElementById('password');
      if (input) input.type = (input.type === 'password') ? 'text' : 'password';
    });
  }

  // ── Form submit ──────────────────────────────────────────────────────
  var form    = document.getElementById('loginForm');
  var btn     = document.getElementById('loginBtn');
  var btnText = document.getElementById('btnText');
  var spinner = document.getElementById('btnSpinner');
  var errBox  = document.getElementById('errorBox');

  function showError(msg) {
    if (errBox) { errBox.textContent = msg; errBox.style.display = 'flex'; }
  }

  function hideError() {
    if (errBox) { errBox.textContent = ''; errBox.style.display = 'none'; }
  }

  function setLoading(loading) {
    if (btn)     btn.disabled = loading;
    if (btnText) btnText.textContent = loading ? 'Connecting...' : 'Connect Device';
    if (spinner) spinner.style.display = loading ? 'block' : 'none';
  }

  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      e.stopPropagation();

      var emailInput    = document.getElementById('email');
      var passwordInput = document.getElementById('password');
      var autoLaunchBox = document.getElementById('autoLaunch');

      var email      = emailInput    ? emailInput.value.trim()    : '';
      var password   = passwordInput ? passwordInput.value         : '';
      var autoLaunch = autoLaunchBox ? autoLaunchBox.checked       : true;

      hideError();

      if (!email || !password) {
        showError('Please enter your email and password.');
        return;
      }

      setLoading(true);

      api.login({ email: email, password: password })
        .then(function(result) {
          if (result && result.success) {
            // Save auto-launch preference
            api.setAutoLaunch(autoLaunch).catch(function() {});

            // Show success state
            if (btnText) btnText.textContent = '✓ Connected!';
            if (spinner) spinner.style.display = 'none';
            if (btn) btn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';

            // Show success page after brief moment
            setTimeout(function() {
              document.body.innerHTML = [
                '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;',
                'height:100vh;gap:20px;text-align:center;padding:32px;',
                'font-family:Inter,system-ui,sans-serif;">',
                '<div style="width:72px;height:72px;background:rgba(34,197,94,0.1);border-radius:50%;',
                'display:flex;align-items:center;justify-content:center;',
                'border:2px solid rgba(34,197,94,0.3);">',
                '<svg viewBox="0 0 24 24" fill="none" width="36" height="36">',
                '<path d="M20 6L9 17l-5-5" stroke="#22c55e" stroke-width="2.5" ',
                'stroke-linecap="round" stroke-linejoin="round"/></svg>',
                '</div>',
                '<div>',
                '<h2 style="font-size:22px;font-weight:700;color:#fff;margin:0 0 10px;">',
                'Device Connected!</h2>',
                '<p style="color:#94a3b8;font-size:14px;margin:0;line-height:1.7;">',
                'This PC is now visible in your<br>Orion dashboard.',
                '<br><br><span style="color:#00bfff;">Orion Agent is running in the system tray.</span>',
                '</p>',
                '</div>',
                '</div>'
              ].join('');
            }, 1200);

          } else {
            var msg = (result && result.error) ? result.error : 'Login failed. Check your credentials.';
            showError(msg);
            setLoading(false);
          }
        })
        .catch(function(err) {
          console.error('[Setup] Login error:', err);
          showError('Connection error. Please check your internet and try again.');
          setLoading(false);
        });
    });
  }
})();
