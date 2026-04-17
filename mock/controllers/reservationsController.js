const { reservations, rides, users, nextId } = require('../data/store');

function enrichReservation(r) {
  const ride = rides.find((ride) => ride.id === r.rideId);
  const passenger = users.find((u) => u.id === r.passengerId);
  return {
    ...r,
    rideOrigin: ride ? ride.origin : null,
    rideDestination: ride ? ride.destination : null,
    rideDepartureTime: ride ? ride.departureTime : null,
    passengerName: passenger ? passenger.name : null,
  };
}

// GET /api/reservations
function getAll(req, res) {
  return res.json(reservations.map(enrichReservation));
}

// GET /api/reservations/:id
function getById(req, res) {
  const reservation = reservations.find((r) => r.id === Number(req.params.id));
  if (!reservation) return res.status(404).json({ error: 'Reserva não encontrada' });
  return res.json(enrichReservation(reservation));
}

// POST /api/reservations  (requer autenticação)
// Body: { rideId }
function create(req, res) {
  const { rideId } = req.body;

  if (!rideId) return res.status(400).json({ error: 'rideId é obrigatório' });

  const ride = rides.find((r) => r.id === Number(rideId));
  if (!ride) return res.status(404).json({ error: 'Carona não encontrada' });
  if (ride.status === 'cancelled') return res.status(400).json({ error: 'Carona cancelada' });
  if (ride.driverId === req.userId) {
    return res.status(400).json({ error: 'O motorista não pode reservar a própria carona' });
  }
  if (ride.availableSeats <= 0) return res.status(400).json({ error: 'Sem vagas disponíveis' });

  const alreadyBooked = reservations.find(
    (r) => r.rideId === Number(rideId) && r.passengerId === req.userId && r.status === 'confirmed',
  );
  if (alreadyBooked) return res.status(409).json({ error: 'Você já possui reserva nesta carona' });

  const newReservation = {
    id: nextId('reservations'),
    rideId: Number(rideId),
    passengerId: req.userId,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  };
  reservations.push(newReservation);
  ride.availableSeats -= 1;

  return res.status(201).json(enrichReservation(newReservation));
}

// PUT /api/reservations/:id  (requer autenticação)
// Body: { status: 'confirmed' | 'cancelled' }
function update(req, res) {
  const reservation = reservations.find((r) => r.id === Number(req.params.id));
  if (!reservation) return res.status(404).json({ error: 'Reserva não encontrada' });
  if (reservation.passengerId !== req.userId) {
    return res.status(403).json({ error: 'Sem permissão para alterar esta reserva' });
  }

  const { status } = req.body;
  const validStatuses = ['confirmed', 'cancelled'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Status inválido. Use: confirmed ou cancelled' });
  }

  // Se está reativando uma reserva cancelada, verifica disponibilidade
  if (status === 'confirmed' && reservation.status === 'cancelled') {
    const ride = rides.find((r) => r.id === reservation.rideId);
    if (!ride || ride.availableSeats <= 0) {
      return res.status(400).json({ error: 'Sem vagas disponíveis para reativar a reserva' });
    }
    ride.availableSeats -= 1;
  }

  // Se está cancelando uma reserva confirmada, devolve a vaga
  if (status === 'cancelled' && reservation.status === 'confirmed') {
    const ride = rides.find((r) => r.id === reservation.rideId);
    if (ride) ride.availableSeats += 1;
  }

  reservation.status = status;
  return res.json(enrichReservation(reservation));
}

// DELETE /api/reservations/:id  (requer autenticação)
function remove(req, res) {
  const index = reservations.findIndex((r) => r.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Reserva não encontrada' });

  const reservation = reservations[index];
  if (reservation.passengerId !== req.userId) {
    return res.status(403).json({ error: 'Sem permissão para excluir esta reserva' });
  }

  // Devolve a vaga na carona se estava confirmada
  if (reservation.status === 'confirmed') {
    const ride = rides.find((r) => r.id === reservation.rideId);
    if (ride) ride.availableSeats += 1;
  }

  reservations.splice(index, 1);
  return res.json({ message: 'Reserva cancelada com sucesso' });
}

module.exports = { getAll, getById, create, update, remove };
