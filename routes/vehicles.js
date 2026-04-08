const express = require('express');
const db = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Cadastrar veículo
router.post('/', authMiddleware, (req, res) => {
  const { plate, model, color, seats } = req.body;
  if (!plate || !model || !color || !seats) {
    return res.status(400).json({ error: 'Todos os campos do veículo são obrigatórios' });
  }
  if (seats < 1 || seats > 10) {
    return res.status(400).json({ error: 'Número de vagas inválido (1-10)' });
  }
  const result = db.prepare(
    'INSERT INTO vehicles (user_id, plate, model, color, seats) VALUES (?, ?, ?, ?, ?)'
  ).run(req.userId, plate.toUpperCase(), model, color, parseInt(seats));

  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(vehicle);
});

// Meus veículos
router.get('/my', authMiddleware, (req, res) => {
  const vehicles = db.prepare('SELECT * FROM vehicles WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
  res.json(vehicles);
});

// Atualizar veículo
router.put('/:id', authMiddleware, (req, res) => {
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!vehicle) return res.status(404).json({ error: 'Veículo não encontrado' });

  const { plate, model, color, seats } = req.body;
  db.prepare('UPDATE vehicles SET plate = ?, model = ?, color = ?, seats = ? WHERE id = ?')
    .run(plate || vehicle.plate, model || vehicle.model, color || vehicle.color, seats || vehicle.seats, req.params.id);

  const updated = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// Deletar veículo
router.delete('/:id', authMiddleware, (req, res) => {
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!vehicle) return res.status(404).json({ error: 'Veículo não encontrado' });
  db.prepare('DELETE FROM vehicles WHERE id = ?').run(req.params.id);
  res.json({ message: 'Veículo removido' });
});

module.exports = router;
