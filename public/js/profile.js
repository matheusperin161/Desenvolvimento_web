let currentVehicleId = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireLogin()) return;

  await loadProfile();
  setupTabs();
  setupPhotoUpload();
  setupProfileForm();
  setupVehicleModal();

  // Check URL params for tab
  const params = new URLSearchParams(window.location.search);
  if (params.get('tab') === 'vehicles') {
    switchTab('vehicles');
  } else {
    await loadVehicles();
  }
});

async function loadProfile() {
  try {
    const user = await api('/auth/me');
    Auth.save(Auth.getToken(), user);

    document.getElementById('profileName').textContent = user.name;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('editName').value = user.name;
    document.getElementById('editEmail').value = user.email;
    document.getElementById('editPhone').value = user.phone;

    const display = document.getElementById('profilePhotoDisplay');
    display.innerHTML = user.profile_photo
      ? `<img src="${user.profile_photo}" class="profile-photo" alt="Foto" />`
      : `<div class="profile-photo-placeholder">${initials(user.name)}</div>`;
  } catch (e) {
    showToast('Erro ao carregar perfil.', 'error');
  }
}

function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
}

function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.getElementById('tabProfile').style.display = name === 'profile' ? '' : 'none';
  document.getElementById('tabVehicles').style.display = name === 'vehicles' ? '' : 'none';
  if (name === 'vehicles') loadVehicles();
}

function setupPhotoUpload() {
  const btn = document.getElementById('photoEditBtn');
  const input = document.getElementById('photoInput');
  btn.addEventListener('click', () => input.click());
  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);
    try {
      btn.disabled = true;
      const data = await apiForm('/users/photo', formData);
      const user = Auth.getUser();
      user.profile_photo = data.profile_photo;
      Auth.save(Auth.getToken(), user);
      showToast('Foto atualizada!', 'success');
      await loadProfile();
    } catch (e) {
      showToast(e.message || 'Erro ao enviar foto.', 'error');
    } finally {
      btn.disabled = false;
      input.value = '';
    }
  });
}

function setupProfileForm() {
  const form = document.getElementById('profileForm');
  const saveBtn = document.getElementById('saveProfileBtn');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('editName').value.trim();
    const phone = document.getElementById('editPhone').value.trim();
    if (!name || !phone) { showToast('Preencha nome e telefone.', 'error'); return; }
    saveBtn.disabled = true;
    saveBtn.textContent = 'Salvando...';
    try {
      const updated = await api('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, phone })
      });
      Auth.save(Auth.getToken(), updated);
      document.getElementById('profileName').textContent = updated.name;
      showToast('Perfil atualizado!', 'success');
    } catch (e) {
      showToast(e.message || 'Erro ao salvar.', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Salvar alterações';
    }
  });
}

async function loadVehicles() {
  const list = document.getElementById('vehiclesList');
  try {
    const vehicles = await api('/vehicles/my');
    if (vehicles.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3"/><rect x="9" y="11" width="14" height="10" rx="2"/><circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/></svg>
          <h3>Nenhum veículo</h3>
          <p>Cadastre seu veículo para poder oferecer caronas.</p>
        </div>`;
      return;
    }
    list.innerHTML = vehicles.map(v => `
      <div class="vehicle-card">
        <div class="vehicle-info">
          <div class="vehicle-icon">🚗</div>
          <div class="vehicle-details">
            <div class="plate">${v.plate}</div>
            <div class="meta">${v.model} · ${v.color} · ${v.seats} vaga${v.seats !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <div class="vehicle-actions">
          <button class="btn btn-ghost btn-sm" onclick="openEditVehicle(${JSON.stringify(v).replace(/"/g, '&quot;')})">Editar</button>
          <button class="btn btn-danger btn-sm" onclick="deleteVehicle(${v.id})">Excluir</button>
        </div>
      </div>`).join('');
  } catch (e) {
    list.innerHTML = `<p class="text-muted text-sm">Erro ao carregar veículos.</p>`;
  }
}

function setupVehicleModal() {
  const modal = document.getElementById('vehicleModal');
  const form = document.getElementById('vehicleForm');
  const addBtn = document.getElementById('addVehicleBtn');
  const closeBtn = document.getElementById('closeVehicleModal');
  const cancelBtn = document.getElementById('cancelVehicleBtn');

  addBtn.addEventListener('click', () => openAddVehicle());
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('saveVehicleBtn');
    const plate = document.getElementById('vPlate').value.trim().toUpperCase();
    const model = document.getElementById('vModel').value.trim();
    const color = document.getElementById('vColor').value.trim();
    const seats = document.getElementById('vSeats').value;

    if (!plate || !model || !color || !seats) { showToast('Preencha todos os campos.', 'error'); return; }
    saveBtn.disabled = true;
    saveBtn.textContent = 'Salvando...';

    try {
      if (currentVehicleId) {
        await api(`/vehicles/${currentVehicleId}`, { method: 'PUT', body: JSON.stringify({ plate, model, color, seats }) });
        showToast('Veículo atualizado!', 'success');
      } else {
        await api('/vehicles', { method: 'POST', body: JSON.stringify({ plate, model, color, seats }) });
        showToast('Veículo cadastrado!', 'success');
      }
      closeModal();
      await loadVehicles();
    } catch (err) {
      showToast(err.message || 'Erro ao salvar veículo.', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Salvar';
    }
  });
}

function openAddVehicle() {
  currentVehicleId = null;
  document.getElementById('vehicleModalTitle').textContent = 'Adicionar veículo';
  document.getElementById('vehicleForm').reset();
  document.getElementById('vehicleModal').classList.remove('hidden');
}

function openEditVehicle(vehicle) {
  currentVehicleId = vehicle.id;
  document.getElementById('vehicleModalTitle').textContent = 'Editar veículo';
  document.getElementById('vPlate').value = vehicle.plate;
  document.getElementById('vModel').value = vehicle.model;
  document.getElementById('vColor').value = vehicle.color;
  document.getElementById('vSeats').value = vehicle.seats;
  document.getElementById('vehicleModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('vehicleModal').classList.add('hidden');
  currentVehicleId = null;
}

async function deleteVehicle(id) {
  if (!confirm('Tem certeza que deseja excluir este veículo?')) return;
  try {
    await api(`/vehicles/${id}`, { method: 'DELETE' });
    showToast('Veículo removido.', 'success');
    await loadVehicles();
  } catch (e) {
    showToast(e.message || 'Erro ao excluir veículo.', 'error');
  }
}
