const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const loginButton = document.getElementById('login-button');
const loginHelp = document.getElementById('login-help');
const defaultHelpText = loginHelp ? loginHelp.textContent : '';

usernameInput.addEventListener('keypress', function (e) {
  if (e.key === 'Enter') passwordInput.focus();
});

passwordInput.addEventListener('keypress', function (e) {
  if (e.key === 'Enter') login();
});

async function login() {
  const username = (usernameInput.value || '').trim();
  const password = (passwordInput.value || '').trim();
  if (!username || !password || !loginButton || loginButton.disabled) return;

  const originalText = loginButton.textContent;
  loginButton.disabled = true;
  loginButton.textContent = '登录中...';
  if (loginHelp) loginHelp.textContent = '正在验证账户信息，请稍候…';

  try {
    const res = await fetch('/api/v1/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (res.ok) {
      await storeAppKey({ username, password });
      window.location.href = '/admin/token';
    } else {
      showToast('用户名或密码错误', 'error');
      if (loginHelp) loginHelp.textContent = '账户或密码不正确，请重新输入。';
    }
  } catch (e) {
    showToast('连接失败', 'error');
    if (loginHelp) loginHelp.textContent = '连接失败，请检查网络或服务状态后重试。';
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = originalText;
  }
}

// Auto-redirect checks
(async () => {
  const existing = await getStoredAppKey();
  const existingUsername = (existing && existing.username) ? String(existing.username) : '';
  const existingPassword = (existing && existing.password) ? String(existing.password) : '';

  usernameInput.value = existingUsername || 'admin';
  passwordInput.focus();

  if (!existingPassword) return;
  if (loginHelp) loginHelp.textContent = '检测到已保存凭据，正在自动校验当前登录状态…';

  fetch('/api/v1/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: usernameInput.value.trim(), password: existingPassword })
  }).then(res => {
    if (res.ok) window.location.href = '/admin/token';
    else if (loginHelp) loginHelp.textContent = defaultHelpText;
  }).catch(() => {
    if (loginHelp) loginHelp.textContent = defaultHelpText;
  });
})();
