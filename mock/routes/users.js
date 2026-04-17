const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const { getAll, getById, updateProfile, deleteUser } = require('../controllers/usersController');

router.get('/', getAll);
router.get('/:id', getById);
router.put('/:id', authMiddleware, updateProfile);
router.delete('/:id', authMiddleware, deleteUser);

module.exports = router;
