const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');


router.get('/checkout', checkoutController.getCheckout);          // Display checkout page
router.post('/place-order', checkoutController.placeOrder);       // Place an order
router.get('/order-confirmation', checkoutController.orderConfirmation); // Order confirmation page

module.exports = router;
