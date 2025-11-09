const express = require('express');
const router = express.Router();
const seatsController = require('../controllers/seatsController');

router.get('/', seatsController.listSeats);
router.get('/:id', seatsController.getSeatById);
router.post('/', seatsController.createSeat);
router.put('/:id', seatsController.updateSeat);
router.delete('/:id', seatsController.deleteSeat);

module.exports = router;
