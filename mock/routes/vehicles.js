const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const { getAll, getMyVehicles, getById, create, update, remove } = require('../controllers/vehiclesController');

router.get('/', getAll);
router.get('/my', authMiddleware, getMyVehicles);
router.get('/:id', getById);
router.post('/', authMiddleware, create);
router.put('/:id', authMiddleware, update);
router.delete('/:id', authMiddleware, remove);

module.exports = router;
