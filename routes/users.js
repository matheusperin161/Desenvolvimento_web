const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user_${req.userId}_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Apenas imagens JPG, PNG ou WEBP são permitidas'));
  }
});

// Atualizar perfil
router.put('/profile', authMiddleware, (req, res) => {
  const { name, phone } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
  }
  db.prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?').run(name, phone, req.userId);
  const user = db.prepare('SELECT id, name, email, phone, profile_photo FROM users WHERE id = ?').get(req.userId);
  res.json(user);
});

// Upload de foto
router.post('/photo', authMiddleware, upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  const photoUrl = `/uploads/${req.file.filename}`;
  db.prepare('UPDATE users SET profile_photo = ? WHERE id = ?').run(photoUrl, req.userId);
  res.json({ profile_photo: photoUrl });
});

// Perfil público de um usuário (para passageiros verem o motorista)
router.get('/:id', (req, res) => {
  const user = db.prepare('SELECT id, name, phone, profile_photo FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json(user);
});

module.exports = router;
