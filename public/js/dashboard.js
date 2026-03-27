document.addEventListener('DOMContentLoaded', async () => {
  if (!requireLogin()) return;

  const user = Auth.getUser();
  const welcomeMsg = document.getElementById('welcomeMsg');
  if (welcomeMsg) welcomeMsg.textContent = `Olá, ${user.name.split(' ')[0]}! Confira suas informações abaixo.`;

  await Promise.all([loadStats(), loadUpcomingRides()]);
});

async function loadStats() {
  try {
    const [driverRides, passengerRides, vehicles, available] = await Promise.all([
      api('/rides/my/driver'),
      api('/rides/my/passenger'),
      api('/vehicles/my'),
      api('/rides')
    ]);

    document.getElementById('statOffered').textContent = driverRides.length;
    document.getElementById('statUsed').textContent = passengerRides.length;
    document.getElementById('statVehicles').textContent = vehicles.length;
    document.getElementById('statAvailable').textContent = available.length;
  } catch (e) {
    console.error('Erro ao carregar estatísticas:', e);
  }
}

async function loadUpcomingRides() {
  const container = document.getElementById('upcomingRides');
  try {
    const [driverRides, passengerRides] = await Promise.all([
      api('/rides/my/driver'),
      api('/rides/my/passenger')
    ]);

    const now = new Date();
    const upcoming = [
      ...driverRides.filter(r => r.status === 'active' && new Date(r.departure_time) > now)
        .map(r => ({ ...r, role: 'driver' })),
      ...passengerRides.filter(r => r.status === 'active' && new Date(r.departure_time) > now)
        .map(r => ({ ...r, role: 'passenger' }))
    ].sort((a, b) => new Date(a.departure_time) - new Date(b.departure_time)).slice(0, 5);

    if (upcoming.length === 0) {
      container.innerHTML = `
        <div class="text-center text-muted" style="padding:1.5rem 0;">
          <p style="font-size:0.9rem;">Nenhuma carona próxima.</p>
          <div style="display:flex;gap:0.5rem;justify-content:center;margin-top:0.75rem;flex-wrap:wrap;">
            <a href="/find-rides.html" class="btn btn-outline btn-sm">Buscar carona</a>
            <a href="/offer-ride.html" class="btn btn-primary btn-sm">Oferecer</a>
          </div>
        </div>`;
      return;
    }

    container.innerHTML = upcoming.map(r => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem 0;border-bottom:1px solid var(--border);gap:0.5rem;cursor:pointer;" onclick="window.location='/ride-detail.html?id=${r.id}'">
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${r.origin} → ${r.destination}</div>
          <div style="font-size:0.8rem;color:var(--text-muted);">${formatDateTime(r.departure_time)}</div>
        </div>
        <div style="display:flex;align-items:center;gap:0.5rem;flex-shrink:0;">
          <span class="badge ${r.role === 'driver' ? 'badge-info' : 'badge-success'}" style="font-size:0.72rem;">
            ${r.role === 'driver' ? 'Motorista' : 'Passageiro'}
          </span>
        </div>
      </div>`).join('');
  } catch (e) {
    container.innerHTML = `<p class="text-muted text-sm">Erro ao carregar caronas.</p>`;
  }
}
