document.addEventListener('DOMContentLoaded', async () => {
  if (!requireLogin()) return;

  // Set min date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('rideDate').min = today;
  document.getElementById('rideDate').value = today;

  await loadVehicles();

  document.getElementById('offerRideForm').addEventListener('submit', handleSubmit);
});

async function loadVehicles() {
  const select = document.getElementById('vehicleSelect');
  const alertDiv = document.getElementById('noVehicleAlert');
  try {
    const vehicles = await api('/vehicles/my');
    if (vehicles.length === 0) {
      select.innerHTML = '<option value="">Nenhum veículo cadastrado</option>';
      select.disabled = true;
      if (alertDiv) { alertDiv.style.display = 'flex'; }
      document.getElementById('submitRideBtn').disabled = true;
      return;
    }
    select.innerHTML = vehicles.map(v =>
      `<option value="${v.id}" data-seats="${v.seats}">${v.plate} — ${v.model} ${v.color}</option>`
    ).join('');
    updateMaxSeats();
    select.addEventListener('change', updateMaxSeats);
  } catch (e) {
    select.innerHTML = '<option value="">Erro ao carregar veículos</option>';
    select.disabled = true;
  }
}

function updateMaxSeats() {
  const select = document.getElementById('vehicleSelect');
  const seatsInput = document.getElementById('rideSeats');
  const selected = select.options[select.selectedIndex];
  if (selected && selected.dataset.seats) {
    const max = parseInt(selected.dataset.seats);
    seatsInput.max = max;
    seatsInput.placeholder = `1 a ${max}`;
    if (parseInt(seatsInput.value) > max) seatsInput.value = max;
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('submitRideBtn');
  const vehicleId = document.getElementById('vehicleSelect').value;
  const origin = document.getElementById('rideOrigin').value.trim();
  const destination = document.getElementById('rideDestination').value.trim();
  const date = document.getElementById('rideDate').value;
  const time = document.getElementById('rideTime').value;
  const price = document.getElementById('ridePrice').value;
  const seats = document.getElementById('rideSeats').value;
  const notes = document.getElementById('rideNotes').value.trim();

  if (!vehicleId || !origin || !destination || !date || !time || price === '' || !seats) {
    showToast('Preencha todos os campos obrigatórios.', 'error');
    return;
  }

  const departure_time = `${date}T${time}:00`;

  if (new Date(departure_time) <= new Date()) {
    showToast('O horário de saída deve ser no futuro.', 'error');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `<span class="spinner" style="width:18px;height:18px;border-width:2px;display:inline-block;vertical-align:middle;"></span> Publicando...`;

  try {
    await api('/rides', {
      method: 'POST',
      body: JSON.stringify({ vehicle_id: vehicleId, origin, destination, departure_time, price, available_seats: seats, notes })
    });
    showToast('Carona publicada com sucesso!', 'success');
    setTimeout(() => window.location.href = '/my-rides.html', 1000);
  } catch (err) {
    showToast(err.message || 'Erro ao publicar carona.', 'error');
    btn.disabled = false;
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> Publicar carona`;
  }
}
