document.addEventListener('DOMContentLoaded', () => {
  if (Auth.isLoggedIn()) {
    window.location.href = '/dashboard.html';
    return;
  }

  const form = document.getElementById('loginForm');
  const btn = document.getElementById('loginBtn');
  const errorDiv = document.getElementById('loginError');
  const errorMsg = document.getElementById('loginErrorMsg');

  function showError(msg) {
    errorMsg.textContent = msg;
    errorDiv.classList.remove('hidden');
    errorDiv.style.display = 'flex';
  }

  function hideError() {
    errorDiv.classList.add('hidden');
    errorDiv.style.display = 'none';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      showError('Preencha todos os campos.');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Entrando...';

    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      Auth.save(data.token, data.user);

      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect') || '/dashboard.html';
      window.location.href = redirect;
    } catch (err) {
      showError(err.message);
      btn.disabled = false;
      btn.textContent = 'Entrar';
    }
  });
});
