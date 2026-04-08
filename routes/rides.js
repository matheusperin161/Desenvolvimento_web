const express = require('express');
const db = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Listar caronas (com filtros)
router.get('/', (req, res) => {
  const { origin, destination, date } = req.query;
  let query = `
    SELECT r.*,
      u.name as driver_name, u.phone as driver_phone, u.profile_photo as driver_photo,
      v.model as vehicle_model, v.color as vehicle_color, v.plate as vehicle_plate
    FROM rides r
    JOIN users u ON r.driver_id = u.id
    JOIN vehicles v ON r.vehicle_id = v.id
    WHERE r.status = 'active' AND r.available_seats > 0
      AND datetime(r.departure_time) > datetime('now', 'localtime')
  `;
  const params = [];
  if (origin) { query += ' AND LOWER(r.origin) LIKE ?'; params.push(`%${origin.toLowerCase()}%`); }
  if (destination) { query += ' AND LOWER(r.destination) LIKE ?'; params.push(`%${destination.toLowerCase()}%`); }
  if (date) { query += ' AND date(r.departure_time) = ?'; params.push(date); }
  query += ' ORDER BY r.departure_time ASC';

  const rides = db.prepare(query).all(...params);
  res.json(rides);
});

// Detalhe de uma carona
router.get('/:id', (req, res) => {
  const ride = db.prepare(`
    SELECT r.*,
      u.name as driver_name, u.phone as driver_phone, u.profile_photo as driver_photo,
      v.model as vehicle_model, v.color as vehicle_color, v.plate as vehicle_plate, v.seats as vehicle_seats
    FROM rides r
    JOIN users u ON r.driver_id = u.id
    JOIN vehicles v ON r.vehicle_id = v.id
    WHERE r.id = ?
  `).get(req.params.id);
  if (!ride) return res.status(404).json({ error: 'Carona não encontrada' });

  const passengers = db.prepare(`
    SELECT u.id, u.name, u.profile_photo FROM reservations res
    JOIN users u ON res.passenger_id = u.id
    WHERE res.ride_id = ? AND res.status = 'confirmed'
  `).all(req.params.id);

  res.json({ ...ride, passengers });
});

// Criar carona
router.post('/', authMiddleware, (req, res) => {
  const { vehicle_id, origin, destination, departure_time, price, available_seats, notes } = req.body;
  if (!vehicle_id || !origin || !destination || !departure_time || price == null || !available_seats) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ? AND user_id = ?').get(vehicle_id, req.userId);
  if (!vehicle) return res.status(404).json({ error: 'Veículo não encontrado' });

  if (new Date(departure_time) <= new Date()) {
    return res.status(400).json({ error: 'Horário de saída deve ser no futuro' });
  }
  const seats = parseInt(available_seats);
  if (seats < 1 || seats > vehicle.seats) {
    return res.status(400).json({ error: `Vagas disponíveis deve ser entre 1 e ${vehicle.seats}` });
  }

  const result = db.prepare(`
    INSERT INTO rides (driver_id, vehicle_id, origin, destination, departure_time, price, available_seats, total_seats, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.userId, vehicle_id, origin, destination, departure_time, parseFloat(price), seats, seats, notes || '');

  const ride = db.prepare('SELECT * FROM rides WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(ride);
});

// Cancelar carona (motorista)
router.delete('/:id', authMiddleware, (req, res) => {
  const ride = db.prepare('SELECT * FROM rides WHERE id = ? AND driver_id = ?').get(req.params.id, req.userId);
  if (!ride) return res.status(404).json({ error: 'Carona não encontrada' });
  db.prepare("UPDATE rides SET status = 'cancelled' WHERE id = ?").run(req.params.id);
  res.json({ message: 'Carona cancelada' });
});

// Minhas caronas (como motorista)
router.get('/my/driver', authMiddleware, (req, res) => {
  const rides = db.prepare(`
    SELECT r.*,
      v.model as vehicle_model, v.color as vehicle_color, v.plate as vehicle_plate,
      (SELECT COUNT(*) FROM reservations WHERE ride_id = r.id AND status = 'confirmed') as confirmed_passengers
    FROM rides r
    JOIN vehicles v ON r.vehicle_id = v.id
    WHERE r.driver_id = ?
    ORDER BY r.departure_time DESC
  `).all(req.userId);
  res.json(rides);
});

// Minhas reservas (como passageiro)
router.get('/my/passenger', authMiddleware, (req, res) => {
  const rides = db.prepare(`
    SELECT r.*,
      u.name as driver_name, u.phone as driver_phone, u.profile_photo as driver_photo,
      v.model as vehicle_model, v.color as vehicle_color, v.plate as vehicle_plate,
      res.id as reservation_id, res.status as reservation_status
    FROM reservations res
    JOIN rides r ON res.ride_id = r.id
    JOIN users u ON r.driver_id = u.id
    JOIN vehicles v ON r.vehicle_id = v.id
    WHERE res.passenger_id = ?
    ORDER BY r.departure_time DESC
  `).all(req.userId);
  res.json(rides);
});

// Reservar vaga
router.post('/:id/reserve', authMiddleware, (req, res) => {
  const ride = db.prepare('SELECT * FROM rides WHERE id = ?').get(req.params.id);
  if (!ride) return res.status(404).json({ error: 'Carona não encontrada' });
  if (ride.status !== 'active') return res.status(400).json({ error: 'Carona não está ativa' });
  if (ride.available_seats <= 0) return res.status(400).json({ error: 'Sem vagas disponíveis' });
  if (ride.driver_id === req.userId) return res.status(400).json({ error: 'Você é o motorista desta carona' });

  const existing = db.prepare('SELECT * FROM reservations WHERE ride_id = ? AND passenger_id = ?').get(req.params.id, req.userId);
  if (existing) return res.status(409).json({ error: 'Você já reservou esta carona' });

  db.prepare('INSERT INTO reservations (ride_id, passenger_id) VALUES (?, ?)').run(req.params.id, req.userId);
  db.prepare('UPDATE rides SET available_seats = available_seats - 1 WHERE id = ?').run(req.params.id);
  res.status(201).json({ message: 'Vaga reservada com sucesso!' });
});

// Cancelar reserva (passageiro)
router.delete('/:id/reserve', authMiddleware, (req, res) => {
  const reservation = db.prepare(
    'SELECT * FROM reservations WHERE ride_id = ? AND passenger_id = ?'
  ).get(req.params.id, req.userId);
  if (!reservation) return res.status(404).json({ error: 'Reserva não encontrada' });

  db.prepare('DELETE FROM reservations WHERE ride_id = ? AND passenger_id = ?').run(req.params.id, req.userId);
  db.prepare('UPDATE rides SET available_seats = available_seats + 1 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Reserva cancelada' });
});

module.exports = router;
