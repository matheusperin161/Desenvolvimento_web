document.addEventListener('DOMContentLoaded', async () => {
  // Set min date for search
  document.getElementById('searchDate').min = new Date().toISOString().split('T')[0];

  await loadRides();

  document.getElementById('searchBtn').addEventListener('click', () => {
    const origin = document.getElementById('searchOrigin').value.trim();
    const dest = document.getElementById('searchDest').value.trim();
    const date = document.getElementById('searchDate').value;
    const params = new URLSearchParams();
    if (origin) params.set('origin', origin);
    if (dest) params.set('destination', dest);
    if (date) params.set('date', date);
    window.location.href = '/find-rides.html?' + params.toString();
  });

  document.getElementById('searchDate').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('searchBtn').click();
  });
});

async function loadRides() {
  const container = document.getElementById('ridesContainer');
  const countEl = document.getElementById('ridesCount');
  try {
    const rides = await api('/rides');
    const recent = rides.slice(0, 6);
    if (countEl) countEl.textContent = rides.length > 0 ? `(${rides.length})` : '';
    if (recent.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3"/><rect x="9" y="11" width="14" height="10" rx="2"/><circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/></svg>
          <h3>Nenhuma carona disponível</h3>
          <p>Seja o primeiro a oferecer uma carona!</p>
          <a href="/offer-ride.html" class="btn btn-primary">Oferecer carona</a>
        </div>`;
      return;
    }
    container.innerHTML = recent.map(r => rideCardHTML(r)).join('');
  } catch (e) {
    container.innerHTML = `<p class="text-muted text-center" style="grid-column:1/-1;">Erro ao carregar caronas.</p>`;
  }
}
