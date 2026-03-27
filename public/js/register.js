document.addEventListener('DOMContentLoaded', () => {
  if (Auth.isLoggedIn()) {
    window.location.href = '/dashboard.html';
    return;
  }

  const form = document.getElementById('registerForm');
  const btn = document.getElementById('registerBtn');
  const errorDiv = document.getElementById('registerError');
  const errorMsg = document.getElementById('registerErrorMsg');

  function showError(msg) {
    errorMsg.textContent = msg;
    errorDiv.classList.remove('hidden');
    errorDiv.style.display = 'flex';
  }

  function hideError() {
    errorDiv.classList.add('hidden');
    errorDiv.style.display = 'none';
  }

  // Phone mask
  const phoneInput = document.getElementById('phone');
  phoneInput.addEventListener('input', () => {
    let v = phoneInput.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 6) v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
    else if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
    else if (v.length > 0) v = `(${v}`;
    phoneInput.value = v;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!name || !email || !phone || !password || !confirmPassword) {
      showError('Preencha todos os campos.');
      return;
    }
    if (password !== confirmPassword) {
      showError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      showError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Criando conta...';

    try {
      const data = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, phone, password })
      });
      Auth.save(data.token, data.user);
      showToast('Conta criada com sucesso! Bem-vindo(a)!', 'success');
      setTimeout(() => window.location.href = '/dashboard.html', 800);
    } catch (err) {
      showError(err.message);
      btn.disabled = false;
      btn.textContent = 'Criar conta';
    }
  });
});
