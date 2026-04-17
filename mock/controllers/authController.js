const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { users, nextId } = require('../data/store');
const { JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/register
function register(req, res) {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'E-mail inválido' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Senha deve ter ao menos 6 caracteres' });
  }
  if (users.find((u) => u.email === email)) {
    return res.status(409).json({ error: 'E-mail já cadastrado' });
  }

  const newUser = {
    id: nextId('users'),
    name,
    email,
    phone,
    password: bcrypt.hashSync(password, 10),
    profilePhoto: null,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);

  const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...publicUser } = newUser;
  return res.status(201).json({ token, user: publicUser });
}

// POST /api/auth/login
function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
  }

  const user = users.find((u) => u.email === email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...publicUser } = user;
  return res.json({ token, user: publicUser });
}

// GET /api/auth/me  (requer autenticação)
function getMe(req, res) {
  const user = users.find((u) => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  const { password: _, ...publicUser } = user;
  return res.json(publicUser);
}

module.exports = { register, login, getMe };
