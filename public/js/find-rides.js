document.addEventListener('DOMContentLoaded', async () => {
  // Pre-fill filters from URL params
  const params = new URLSearchParams(window.location.search);
  if (params.get('origin')) document.getElementById('filterOrigin').value = params.get('origin');
  if (params.get('destination')) document.getElementById('filterDest').value = params.get('destination');
  if (params.get('date')) document.getElementById('filterDate').value = params.get('date');

  document.getElementById('filterDate').min = new Date().toISOString().split('T')[0];

  await loadRides();

  document.getElementById('filterForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await loadRides();
  });

  document.getElementById('clearFilters').addEventListener('click', async () => {
    document.getElementById('filterForm').reset();
    await loadRides();
  });
});

async function loadRides() {
  const container = document.getElementById('ridesContainer');
  const countEl = document.getElementById('resultsCount');
  container.innerHTML = `<div class="loader" style="grid-column:1/-1;"><div class="spinner"></div></div>`;

  const origin = document.getElementById('filterOrigin').value.trim();
  const dest = document.getElementById('filterDest').value.trim();
  const date = document.getElementById('filterDate').value;

  const params = new URLSearchParams();
  if (origin) params.set('origin', origin);
  if (dest) params.set('destination', dest);
  if (date) params.set('date', date);

  try {
    const rides = await api('/rides?' + params.toString());
    if (countEl) {
      const hasFilter = origin || dest || date;
      countEl.textContent = `${rides.length} carona${rides.length !== 1 ? 's' : ''} encontrada${rides.length !== 1 ? 's' : ''}${hasFilter ? ' com os filtros aplicados' : ''}`;
    }
    if (rides.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <h3>Nenhuma carona encontrada</h3>
          <p>Tente mudar os filtros ou aguarde novas caronas serem publicadas.</p>
          ${Auth.isLoggedIn() ? `<a href="/offer-ride.html" class="btn btn-primary">Oferecer uma carona</a>` : `<a href="/login.html" class="btn btn-primary">Entre para oferecer</a>`}
        </div>`;
      return;
    }
    container.innerHTML = rides.map(r => rideCardHTML(r)).join('');
  } catch (e) {
    container.innerHTML = `<p class="text-muted text-center" style="grid-column:1/-1;">Erro ao carregar caronas.</p>`;
  }
}
