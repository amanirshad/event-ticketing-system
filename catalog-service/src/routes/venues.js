const express = require('express');
const router = express.Router();
const venuesController = require('../controllers/venuesController');

router.get('/', venuesController.listVenues);
router.get('/:id', venuesController.getVenueById);
router.post('/', venuesController.createVenue);
router.put('/:id', venuesController.updateVenue);
router.delete('/:id', venuesController.deleteVenue);
router.get('/:id/events', venuesController.listVenueEvents);

module.exports = router;
