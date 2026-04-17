const { vehicles, users, nextId } = require('../data/store');

// GET /api/vehicles
function getAll(req, res) {
  const result = vehicles.map((v) => {
    const owner = users.find((u) => u.id === v.userId);
    return { ...v, ownerName: owner ? owner.name : null };
  });
  return res.json(result);
}

// GET /api/vehicles/my  (requer autenticação)
function getMyVehicles(req, res) {
  const myVehicles = vehicles.filter((v) => v.userId === req.userId);
  return res.json(myVehicles);
}

// GET /api/vehicles/:id
function getById(req, res) {
  const vehicle = vehicles.find((v) => v.id === Number(req.params.id));
  if (!vehicle) return res.status(404).json({ error: 'Veículo não encontrado' });
  const owner = users.find((u) => u.id === vehicle.userId);
  return res.json({ ...vehicle, ownerName: owner ? owner.name : null });
}

// POST /api/vehicles  (requer autenticação)
function create(req, res) {
  const { plate, model, color, seats } = req.body;

  if (!plate || !model || !color || !seats) {
    return res.status(400).json({ error: 'Placa, modelo, cor e número de assentos são obrigatórios' });
  }
  if (seats < 1 || seats > 9) {
    return res.status(400).json({ error: 'Número de assentos deve ser entre 1 e 9' });
  }
  if (vehicles.find((v) => v.plate === plate)) {
    return res.status(409).json({ error: 'Placa já cadastrada' });
  }

  const newVehicle = {
    id: nextId('vehicles'),
    userId: req.userId,
    plate,
    model,
    color,
    seats: Number(seats),
    createdAt: new Date().toISOString(),
  };
  vehicles.push(newVehicle);
  return res.status(201).json(newVehicle);
}

// PUT /api/vehicles/:id  (requer autenticação)
function update(req, res) {
  const vehicle = vehicles.find((v) => v.id === Number(req.params.id));
  if (!vehicle) return res.status(404).json({ error: 'Veículo não encontrado' });
  if (vehicle.userId !== req.userId) {
    return res.status(403).json({ error: 'Sem permissão para editar este veículo' });
  }

  const { plate, model, color, seats } = req.body;
  if (plate) vehicle.plate = plate;
  if (model) vehicle.model = model;
  if (color) vehicle.color = color;
  if (seats) vehicle.seats = Number(seats);

  return res.json(vehicle);
}

// DELETE /api/vehicles/:id  (requer autenticação)
function remove(req, res) {
  const index = vehicles.findIndex((v) => v.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Veículo não encontrado' });
  if (vehicles[index].userId !== req.userId) {
    return res.status(403).json({ error: 'Sem permissão para excluir este veículo' });
  }

  vehicles.splice(index, 1);
  return res.json({ message: 'Veículo removido com sucesso' });
}

module.exports = { getAll, getMyVehicles, getById, create, update, remove };
