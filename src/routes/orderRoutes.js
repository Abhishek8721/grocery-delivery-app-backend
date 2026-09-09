const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getOrderById } = require('../controllers/orderController');
const { authenticateUser } = require('../middleware/auth');

router.use(authenticateUser);

router.post('/', createOrder);
router.get('/', getMyOrders);
router.get('/:id', getOrderById);

module.exports = router;
