let currentPage = 1;

document.addEventListener('DOMContentLoaded', async () => {
  // Pre-fill filters from URL params
  const params = new URLSearchParams(window.location.search);
  if (params.get('origin')) document.getElementById('filterOrigin').value = params.get('origin');
  if (params.get('destination')) document.getElementById('filterDest').value = params.get('destination');
  if (params.get('date')) document.getElementById('filterDate').value = params.get('date');
  if (params.get('max_price')) document.getElementById('filterMaxPrice').value = params.get('max_price');
  if (params.get('min_seats')) document.getElementById('filterMinSeats').value = params.get('min_seats');

  document.getElementById('filterDate').min = new Date().toISOString().split('T')[0];

  await loadRides(1);

  document.getElementById('filterForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await loadRides(1);
  });

  document.getElementById('clearFilters').addEventListener('click', async () => {
    document.getElementById('filterForm').reset();
    await loadRides(1);
  });
});

async function loadRides(page = 1) {
  currentPage = page;
  const container = document.getElementById('ridesContainer');
  const countEl = document.getElementById('resultsCount');
  container.innerHTML = skeletonCards(6);

  const origin = document.getElementById('filterOrigin').value.trim();
  const dest = document.getElementById('filterDest').value.trim();
  const date = document.getElementById('filterDate').value;
  const timeFrom = document.getElementById('filterTimeFrom').value;
  const timeTo = document.getElementById('filterTimeTo').value;
  const maxPrice = document.getElementById('filterMaxPrice').value;
  const minSeats = document.getElementById('filterMinSeats').value;

  const params = new URLSearchParams();
  if (origin) params.set('origin', origin);
  if (dest) params.set('destination', dest);
  if (date) params.set('date', date);
  if (timeFrom) params.set('time_from', timeFrom);
  if (timeTo) params.set('time_to', timeTo);
  if (maxPrice) params.set('max_price', maxPrice);
  if (minSeats) params.set('min_seats', minSeats);
  params.set('page', page);
  params.set('limit', 12);

  try {
    const data = await api('/rides?' + params.toString());
    const rides = data.rides || [];
    const total = data.total || 0;
    const totalPages = data.totalPages || 1;

    if (countEl) {
      const hasFilter = origin || dest || date || timeFrom || timeTo || maxPrice || minSeats;
      countEl.textContent = `${total} carona${total !== 1 ? 's' : ''} encontrada${total !== 1 ? 's' : ''}${hasFilter ? ' com os filtros aplicados' : ''}`;
    }

    if (rides.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <h3>Nenhuma carona encontrada</h3>
          <p>Tente mudar os filtros ou aguarde novas caronas serem publicadas.</p>
          ${Auth.isLoggedIn() ? `<a href="/offer-ride.html" class="btn btn-primary">Oferecer uma carona</a>` : `<a href="/login.html" class="btn btn-primary">Entre para oferecer</a>`}
        </div>`;
      renderPagination(0, 1);
      return;
    }

    container.innerHTML = rides.map(r => rideCardHTML(r)).join('');
    renderPagination(total, totalPages);
  } catch (e) {
    container.innerHTML = `<p class="text-muted text-center" style="grid-column:1/-1;">Erro ao carregar caronas.</p>`;
  }
}

function renderPagination(total, totalPages) {
  let el = document.getElementById('paginationControls');
  if (!el) {
    el = document.createElement('div');
    el.id = 'paginationControls';
    el.className = 'pagination';
    document.getElementById('ridesContainer').after(el);
  }

  if (totalPages <= 1) { el.innerHTML = ''; return; }

  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;

  el.innerHTML = `
    <button class="btn btn-outline btn-sm" onclick="loadRides(${currentPage - 1})" ${prevDisabled ? 'disabled' : ''}>← Anterior</button>
    <span class="pagination-info">Página ${currentPage} de ${totalPages}</span>
    <button class="btn btn-outline btn-sm" onclick="loadRides(${currentPage + 1})" ${nextDisabled ? 'disabled' : ''}>Próxima →</button>`;

  if (!prevDisabled || !nextDisabled) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
