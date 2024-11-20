const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const { verifyPayment } = require('../middleware/payment');
const { isAuthenticated } = require ('../middleware/block')

// Display checkout page
router.get('/checkout', isAuthenticated,checkoutController.getCheckout);

// Place an order (handles both COD and Razorpay)
router.post('/place-order', checkoutController.placeOrder);

router.get('/order-confirmation', checkoutController.orderConfirmation); // Order confirmation page

//Razorpay Payment Verification Route
router.post('/payment/verify', verifyPayment, async (req, res) => {
  try {
    const { orderDetails } = req.session;
    const userId = req.session.userId;

    // Retrieve cart details to include items in the order
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart) return res.status(400).send('No items in cart to place the order.');

    await createOrder(
      userId,
      cart,
      orderDetails.totalAmount,
      {
        address: orderDetails.address,
        city: orderDetails.city,
        postalCode: orderDetails.postalCode,
        country: orderDetails.country,
      },
      'Razorpay',
      'Paid'
    );

    // Clear session details
    req.session.orderDetails = null;
    req.session.discount = 0;

    return res.redirect('/checkout/success');
  } catch (error) {
    console.error('Error processing Razorpay order:', error);
    return res.status(500).send('Error completing your order.');
  }
});
// Success page after order confirmation
router.get('/success', checkoutController.orderConfirmation);

module.exports = router;
