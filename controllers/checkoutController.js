const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/order');
const Cart = require('../models/cart');
const Product = require('../models/product');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: 'rzp_test_RJf3MNDoHKza5M', // Your Razorpay key_id
  key_secret: 'gcdfcHLWnt5eJrPOUwfjCsQC' // Your Razorpay key_secret
});

// Display checkout page
exports.getCheckout = async (req, res) => {
  const userId = req.session.userId;
  const cart = await Cart.findOne({ userId }).populate('items.productId');
  const cartItems = cart ? cart.items : [];
  const discount = req.session.discount || 0;
  const totalAmount = cartItems.reduce((total, item) => total + item.price * item.quantity, 0) - discount;

  res.render('client/checkout', { cartItems, totalAmount });
};

// Helper function to create an order
const createOrder = async (userId, cart, totalAmount, addressDetails, paymentMethod, paymentStatus) => {
  const newOrder = new Order({
    userId,
    items: cart.items.map(item => ({
      productId: item.productId._id,
      name: item.productId.name,
      price: item.productId.price,
      quantity: item.quantity,
    })),
    totalAmount,
    shippingAddress: addressDetails,
    paymentMethod,
    paymentStatus,
  });

  await newOrder.save();

  // Clear cart after order creation
  await Cart.findOneAndDelete({ userId });

  // Update stock for purchased products
  for (let item of cart.items) {
    const product = await Product.findById(item.productId._id);
    if (product.stock >= item.quantity) {
      product.stock -= item.quantity;
      await product.save();
    } else {
      throw new Error(`${product.name} is out of stock.`);
    }
  }

  return newOrder;
};

// Place an order
exports.placeOrder = async (req, res) => {
  const { fullName, address, city, postalCode, country, paymentMethod } = req.body;
  const userId = req.session.userId;
  const cart = await Cart.findOne({ userId }).populate('items.productId');

  if (!cart) return res.status(400).json({ message: 'No items in cart.' });

  const discount = req.session.discount || 0;
  const totalAmount = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0) - discount;
  const addressDetails = { address, city, postalCode, country };

  if (paymentMethod === 'COD') {
    try {
      await createOrder(userId, cart, totalAmount, addressDetails, paymentMethod, 'Paid');
      req.session.discount = 0; // Reset discount after order placement
      return res.redirect('/order-confirmation');
    } catch (error) {
      console.error('Error processing COD order:', error);
      return res.status(500).send(error.message);
    }
  } else if (paymentMethod === 'Razorpay') {
    const amountInPaise = Math.round(totalAmount * 100); // Razorpay accepts payment in paise (1 INR = 100 paise)
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `order_rcptid_${Date.now()}`,
    };

    try {
      const razorpayOrder = await razorpay.orders.create(options);

      // Store order details in session for later verification
      req.session.orderDetails = {
        fullName,
        address,
        city,
        postalCode,
        country,
        paymentMethod,
        razorpayOrderId: razorpayOrder.id,
        totalAmount,
      };

      return res.render('client/razorpayPayment', {
        orderId: razorpayOrder.id,
        amount: options.amount,
        currency: options.currency,
      });
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      return res.status(500).send('Error processing payment.');
    }
  } else {
    return res.status(400).send('Invalid payment method selected.');
  }
};

// Verify Razorpay payment
exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  // Recreate the Razorpay signature to verify
  const generatedSignature = crypto
    .createHmac('sha256', razorpay.key_secret)
    .update(razorpay_order_id + '|' + razorpay_payment_id)
    .digest('hex');

  if (generatedSignature !== razorpay_signature) {
    return res.status(400).json({ message: 'Payment verification failed.' });
  }

  // Retrieve the session-stored order details
  const orderDetails = req.session.orderDetails;
  if (!orderDetails) {
    return res.status(400).json({ message: 'Order details not found in session.' });
  }

  try {
    const userId = req.session.userId;
    const cart = await Cart.findOne({ userId }).populate('items.productId');

    if (!cart) return res.status(400).json({ message: 'No items in cart.' });

    // Create the order in the database and mark it as 'Paid'
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
      orderDetails.paymentMethod,
      'Paid'
    );

    // Reset the discount and clear session order details
    req.session.discount = 0;
    req.session.orderDetails = null;

    res.json({ message: 'Payment successful' });
  } catch (error) {
    console.error('Error processing order:', error);
    return res.status(500).json({ message: 'Error saving order details.' });
  }
};

// Render order confirmation page
exports.orderConfirmation = (req, res) => {
  res.render('client/confirmation');
};
