
const express = require('express');
const router = express.Router();
const controller = require('../controllers/orderController');

router.post('/', controller.createOrder);
router.get('/:id', controller.getOrder);
router.delete('/:id', controller.cancelOrder);
router.get('/', controller.listOrders);
console.log(controller);

module.exports = router;
