const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const {
  getAll,
  getById,
  create,
  update,
  remove,
  getMyRidesAsDriver,
  getMyRidesAsPassenger,
} = require('../controllers/ridesController');

router.get('/', getAll);
router.get('/my/driver', authMiddleware, getMyRidesAsDriver);
router.get('/my/passenger', authMiddleware, getMyRidesAsPassenger);
router.get('/:id', getById);
router.post('/', authMiddleware, create);
router.put('/:id', authMiddleware, update);
router.delete('/:id', authMiddleware, remove);

module.exports = router;
