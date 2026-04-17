const { users } = require('../data/store');

function publicUser(u) {
  const { password: _, ...pub } = u;
  return pub;
}

// GET /api/users
function getAll(req, res) {
  return res.json(users.map(publicUser));
}

// GET /api/users/:id
function getById(req, res) {
  const user = users.find((u) => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  return res.json(publicUser(user));
}

// PUT /api/users/:id  (requer autenticação)
function updateProfile(req, res) {
  const id = Number(req.params.id);
  if (req.userId !== id) {
    return res.status(403).json({ error: 'Sem permissão para editar este perfil' });
  }

  const user = users.find((u) => u.id === id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  const { name, phone } = req.body;
  if (name) user.name = name;
  if (phone) user.phone = phone;

  return res.json(publicUser(user));
}

// DELETE /api/users/:id  (requer autenticação)
function deleteUser(req, res) {
  const id = Number(req.params.id);
  if (req.userId !== id) {
    return res.status(403).json({ error: 'Sem permissão para excluir este usuário' });
  }

  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return res.status(404).json({ error: 'Usuário não encontrado' });

  users.splice(index, 1);
  return res.json({ message: 'Usuário removido com sucesso' });
}

module.exports = { getAll, getById, updateProfile, deleteUser };
