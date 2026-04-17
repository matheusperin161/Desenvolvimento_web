const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const { getAll, getById, create, update, remove } = require('../controllers/reservationsController');

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', authMiddleware, create);
router.put('/:id', authMiddleware, update);
router.delete('/:id', authMiddleware, remove);

module.exports = router;
