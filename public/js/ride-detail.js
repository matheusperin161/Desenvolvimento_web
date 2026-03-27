let rideData = null;

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) { window.location.href = '/find-rides.html'; return; }

  await loadRide(id);

  document.getElementById('closeConfirmModal').addEventListener('click', closeConfirm);
  document.getElementById('cancelReserveBtn').addEventListener('click', closeConfirm);
  document.getElementById('confirmModal').addEventListener('click', (e) => {
    if (e.target.id === 'confirmModal') closeConfirm();
  });
});

function closeConfirm() {
  document.getElementById('confirmModal').classList.add('hidden');
}

async function loadRide(id) {
  const content = document.getElementById('rideContent');
  try {
    const ride = await api(`/rides/${id}`);
    rideData = ride;
    renderRide(ride);
  } catch (e) {
    content.innerHTML = `
      <div class="container">
        <div class="empty-state" style="margin-top:3rem;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <h3>Carona não encontrada</h3>
          <p>Esta carona pode ter sido cancelada ou não existe.</p>
          <a href="/find-rides.html" class="btn btn-primary">Ver outras caronas</a>
        </div>
      </div>`;
  }
}

function renderRide(ride) {
  const currentUser = Auth.getUser();
  const isDriver = currentUser && currentUser.id === ride.driver_id;
  const isLoggedIn = Auth.isLoggedIn();
  const alreadyReserved = ride.passengers && currentUser && ride.passengers.some(p => p.id === currentUser.id);

  let actionBtn = '';
  if (isDriver) {
    actionBtn = `<span class="badge badge-info" style="font-size:1rem;padding:0.5rem 1rem;">Você é o motorista</span>`;
  } else if (!isLoggedIn) {
    actionBtn = `<a href="/login.html?redirect=/ride-detail.html?id=${ride.id}" class="btn btn-secondary btn-lg">Entrar para reservar</a>`;
  } else if (ride.status !== 'active') {
    actionBtn = `<span class="badge badge-danger" style="font-size:1rem;padding:0.5rem 1rem;">Carona ${ride.status === 'cancelled' ? 'cancelada' : 'encerrada'}</span>`;
  } else if (ride.available_seats === 0) {
    actionBtn = `<button class="btn btn-lg" disabled style="background:var(--border);color:var(--text-muted);">Sem vagas disponíveis</button>`;
  } else if (alreadyReserved) {
    actionBtn = `
      <span class="badge badge-success" style="font-size:1rem;padding:0.5rem 1rem;">Vaga reservada ✓</span>
      <button class="btn btn-ghost btn-sm" onclick="cancelReservation(${ride.id})" style="color:var(--danger);">Cancelar minha reserva</button>`;
  } else {
    actionBtn = `<button class="btn btn-secondary btn-lg" onclick="openReserveModal()">Reservar vaga — ${formatPrice(ride.price)}</button>`;
  }

  const waLink = `https://wa.me/55${ride.driver_phone.replace(/\D/g,'')}?text=${encodeURIComponent(`Olá ${ride.driver_name}! Vi sua carona (${ride.origin} → ${ride.destination}) no Carona Uni e tenho interesse.`)}`;

  const passengersHTML = ride.passengers && ride.passengers.length > 0
    ? `<div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.5rem;">
        ${ride.passengers.map(p => `
          <div title="${p.name}" style="display:flex;align-items:center;gap:0.4rem;font-size:0.85rem;color:var(--text-muted);">
            ${makeAvatar(p.name, p.profile_photo, 28)}
            <span>${p.name.split(' ')[0]}</span>
          </div>`).join('')}
       </div>`
    : `<p style="color:var(--text-muted);font-size:0.9rem;">Nenhum passageiro ainda.</p>`;

  document.getElementById('rideContent').innerHTML = `
    <div class="ride-detail-hero">
      <div style="max-width:1200px;margin:0 auto;">
        <a href="/find-rides.html" style="color:rgba(255,255,255,0.7);font-size:0.875rem;display:inline-flex;align-items:center;gap:0.3rem;margin-bottom:1rem;text-decoration:none;">
          ← Voltar às caronas
        </a>
        <div class="route-display">
          <span>${ride.origin}</span>
          <div class="dot"></div><div class="dot"></div><div class="dot"></div>
          <span>${ride.destination}</span>
        </div>
        <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
          ${statusBadge(ride.status)}
          <span style="opacity:0.85;font-size:0.9rem;">${formatDateTime(ride.departure_time)}</span>
        </div>
      </div>
    </div>

    <div class="container" style="max-width:960px;">
      <div style="display:grid;grid-template-columns:1fr auto;gap:2rem;align-items:start;flex-wrap:wrap;" class="flex-wrap">
        <div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Data e hora</div>
              <div class="info-value">${formatDateTime(ride.departure_time)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Valor por pessoa</div>
              <div class="info-value" style="color:var(--secondary);font-size:1.3rem;">${formatPrice(ride.price)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Vagas disponíveis</div>
              <div class="info-value">${ride.available_seats} / ${ride.total_seats}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Veículo</div>
              <div class="info-value">${ride.vehicle_model} ${ride.vehicle_color}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Placa</div>
              <div class="info-value">${ride.vehicle_plate}</div>
            </div>
          </div>

          ${ride.notes ? `
          <div class="card mt-2">
            <h4 style="font-weight:600;margin-bottom:0.5rem;">Observações do motorista</h4>
            <p style="color:var(--text-muted);font-style:italic;">"${ride.notes}"</p>
          </div>` : ''}

          <!-- Motorista -->
          <div class="card mt-2">
            <h4 style="font-weight:600;margin-bottom:1rem;">Motorista</h4>
            <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
              ${makeAvatar(ride.driver_name, ride.driver_photo, 56)}
              <div>
                <div style="font-weight:700;font-size:1.1rem;">${ride.driver_name}</div>
                <div style="color:var(--text-muted);font-size:0.875rem;margin-top:0.2rem;">📞 ${ride.driver_phone}</div>
              </div>
              <div style="margin-left:auto;display:flex;gap:0.5rem;flex-wrap:wrap;">
                <a href="tel:${ride.driver_phone}" class="btn btn-outline btn-sm">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.03 1.22 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.14v2.78z"/></svg>
                  Ligar
                </a>
                <a href="${waLink}" target="_blank" rel="noopener" class="btn whatsapp-btn btn-sm">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  WhatsApp
                </a>
              </div>
            </div>
          </div>

          <!-- Passageiros -->
          <div class="card mt-2">
            <h4 style="font-weight:600;margin-bottom:0.75rem;">Passageiros confirmados (${ride.passengers ? ride.passengers.length : 0}/${ride.total_seats})</h4>
            ${passengersHTML}
          </div>
        </div>

        <!-- Coluna de ação -->
        <div style="position:sticky;top:80px;min-width:200px;">
          <div class="card" style="text-align:center;">
            <div style="font-size:2rem;font-weight:800;color:var(--secondary);margin-bottom:0.25rem;">${formatPrice(ride.price)}</div>
            <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:1.25rem;">por pessoa</div>
            <div style="display:flex;flex-direction:column;gap:0.75rem;align-items:center;">
              ${actionBtn}
            </div>
          </div>
        </div>
      </div>
    </div>`;

  // Confirm modal body
  document.getElementById('confirmModalBody').innerHTML = `
    <p style="margin-bottom:0.75rem;">Você está reservando uma vaga na carona:</p>
    <div style="background:var(--bg);border-radius:var(--radius-sm);padding:1rem;margin-bottom:0.5rem;">
      <div style="font-weight:600;">${ride.origin} → ${ride.destination}</div>
      <div style="color:var(--text-muted);font-size:0.875rem;margin-top:0.25rem;">${formatDateTime(ride.departure_time)}</div>
      <div style="font-weight:700;color:var(--secondary);margin-top:0.5rem;">${formatPrice(ride.price)}</div>
    </div>
    <p style="font-size:0.875rem;color:var(--text-muted);">Após confirmar, entre em contato com o motorista pelo telefone ou WhatsApp.</p>`;

  document.getElementById('confirmReserveBtn').onclick = () => doReserve(ride.id);
}

function openReserveModal() {
  if (!Auth.isLoggedIn()) { window.location.href = '/login.html'; return; }
  document.getElementById('confirmModal').classList.remove('hidden');
}

async function doReserve(id) {
  const btn = document.getElementById('confirmReserveBtn');
  btn.disabled = true;
  btn.textContent = 'Reservando...';
  try {
    await api(`/rides/${id}/reserve`, { method: 'POST' });
    closeConfirm();
    showToast('Vaga reservada com sucesso! Entre em contato com o motorista.', 'success', 5000);
    setTimeout(() => loadRide(id), 800);
  } catch (err) {
    showToast(err.message || 'Erro ao reservar vaga.', 'error');
    btn.disabled = false;
    btn.textContent = 'Confirmar reserva';
  }
}

async function cancelReservation(id) {
  if (!confirm('Tem certeza que deseja cancelar sua reserva?')) return;
  try {
    await api(`/rides/${id}/reserve`, { method: 'DELETE' });
    showToast('Reserva cancelada.', 'success');
    await loadRide(id);
  } catch (err) {
    showToast(err.message || 'Erro ao cancelar reserva.', 'error');
  }
}
