const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const { verifyPayment } = require('../middleware/payment');

// Display checkout page
router.get('/checkout', checkoutController.getCheckout);

// Place an order (handles both COD and Razorpay)
router.post('/place-order', checkoutController.placeOrder);

router.get('/order-confirmation', checkoutController.orderConfirmation); // Order confirmation page
// Razorpay payment verification route
router.post('/payment/verify', verifyPayment, async (req, res) => {
  try {
    const { orderDetails } = req.session;

    // Save the order to the database after successful payment verification
    const newOrder = new Order({
      userId: req.session.userId,
      items: orderDetails.items,
      totalAmount: orderDetails.totalAmount,
      shippingAddress: orderDetails.shippingAddress,
      paymentMethod: 'Razorpay',
      paymentStatus: 'Paid'
    });

    await newOrder.save();

    // Clear session details after order placement
    req.session.orderDetails = null;
    req.session.discount = 0;

    res.redirect('/checkout/success');
  } catch (error) {
    console.error('Error saving order after Razorpay payment verification:', error);
    res.status(500).send('Error completing your order.');
  }
});

// Success page after order confirmation
router.get('/success', checkoutController.orderConfirmation);

module.exports = router;
