const { rides, users, vehicles, reservations, nextId } = require('../data/store');

function enrichRide(ride) {
  const driver = users.find((u) => u.id === ride.driverId);
  const vehicle = vehicles.find((v) => v.id === ride.vehicleId);
  return {
    ...ride,
    driverName: driver ? driver.name : null,
    driverPhone: driver ? driver.phone : null,
    vehicleModel: vehicle ? vehicle.model : null,
    vehicleColor: vehicle ? vehicle.color : null,
    vehiclePlate: vehicle ? vehicle.plate : null,
  };
}

// GET /api/rides
// Query params: origin, destination, date
function getAll(req, res) {
  let result = rides.filter((r) => r.status === 'active' && r.availableSeats > 0);

  const { origin, destination, date } = req.query;
  if (origin) {
    result = result.filter((r) => r.origin.toLowerCase().includes(origin.toLowerCase()));
  }
  if (destination) {
    result = result.filter((r) => r.destination.toLowerCase().includes(destination.toLowerCase()));
  }
  if (date) {
    result = result.filter((r) => r.departureTime.startsWith(date));
  }

  return res.json(result.map(enrichRide));
}

// GET /api/rides/:id
function getById(req, res) {
  const ride = rides.find((r) => r.id === Number(req.params.id));
  if (!ride) return res.status(404).json({ error: 'Carona não encontrada' });

  const passengers = reservations
    .filter((res) => res.rideId === ride.id && res.status === 'confirmed')
    .map((res) => {
      const user = users.find((u) => u.id === res.passengerId);
      return { reservationId: res.id, passengerId: res.passengerId, passengerName: user ? user.name : null };
    });

  return res.json({ ...enrichRide(ride), passengers });
}

// POST /api/rides  (requer autenticação)
function create(req, res) {
  const { vehicleId, origin, destination, departureTime, price, availableSeats, notes } = req.body;

  if (!vehicleId || !origin || !destination || !departureTime || price == null || !availableSeats) {
    return res.status(400).json({ error: 'Campos obrigatórios: vehicleId, origin, destination, departureTime, price, availableSeats' });
  }

  const vehicle = vehicles.find((v) => v.id === Number(vehicleId) && v.userId === req.userId);
  if (!vehicle) {
    return res.status(400).json({ error: 'Veículo não encontrado ou não pertence a este usuário' });
  }
  if (availableSeats > vehicle.seats) {
    return res.status(400).json({ error: 'Vagas disponíveis não podem ser maiores que o total de assentos do veículo' });
  }
  if (new Date(departureTime) <= new Date()) {
    return res.status(400).json({ error: 'A data de partida deve ser no futuro' });
  }

  const newRide = {
    id: nextId('rides'),
    driverId: req.userId,
    vehicleId: Number(vehicleId),
    origin,
    destination,
    departureTime,
    price: Number(price),
    availableSeats: Number(availableSeats),
    totalSeats: Number(availableSeats),
    notes: notes || null,
    status: 'active',
    createdAt: new Date().toISOString(),
  };
  rides.push(newRide);
  return res.status(201).json(enrichRide(newRide));
}

// PUT /api/rides/:id  (requer autenticação)
function update(req, res) {
  const ride = rides.find((r) => r.id === Number(req.params.id));
  if (!ride) return res.status(404).json({ error: 'Carona não encontrada' });
  if (ride.driverId !== req.userId) {
    return res.status(403).json({ error: 'Sem permissão para editar esta carona' });
  }
  if (ride.status === 'cancelled') {
    return res.status(400).json({ error: 'Carona já cancelada não pode ser editada' });
  }

  const { origin, destination, departureTime, price, availableSeats, notes } = req.body;
  if (origin) ride.origin = origin;
  if (destination) ride.destination = destination;
  if (departureTime) ride.departureTime = departureTime;
  if (price != null) ride.price = Number(price);
  if (availableSeats != null) ride.availableSeats = Number(availableSeats);
  if (notes !== undefined) ride.notes = notes;

  return res.json(enrichRide(ride));
}

// DELETE /api/rides/:id  (requer autenticação)
function remove(req, res) {
  const ride = rides.find((r) => r.id === Number(req.params.id));
  if (!ride) return res.status(404).json({ error: 'Carona não encontrada' });
  if (ride.driverId !== req.userId) {
    return res.status(403).json({ error: 'Sem permissão para cancelar esta carona' });
  }

  ride.status = 'cancelled';
  return res.json({ message: 'Carona cancelada com sucesso', ride: enrichRide(ride) });
}

// GET /api/rides/my/driver  (requer autenticação)
function getMyRidesAsDriver(req, res) {
  const myRides = rides.filter((r) => r.driverId === req.userId);
  return res.json(myRides.map(enrichRide));
}

// GET /api/rides/my/passenger  (requer autenticação)
function getMyRidesAsPassenger(req, res) {
  const myReservations = reservations.filter(
    (res) => res.passengerId === req.userId && res.status === 'confirmed',
  );
  const result = myReservations.map((reservation) => {
    const ride = rides.find((r) => r.id === reservation.rideId);
    return ride ? { ...enrichRide(ride), reservationId: reservation.id } : null;
  }).filter(Boolean);

  return res.json(result);
}

module.exports = { getAll, getById, create, update, remove, getMyRidesAsDriver, getMyRidesAsPassenger };
