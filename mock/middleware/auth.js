const jwt = require('jsonwebtoken');
const { users } = require('../data/store');

const JWT_SECRET = 'carona-universitaria-mock-secret';

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = users.find((u) => u.id === payload.userId);
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }
    req.userId = user.id;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

module.exports = { authMiddleware, JWT_SECRET };
