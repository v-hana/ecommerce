const Razorpay = require('razorpay');
const Order = require('../models/order');
const Cart = require('../models/cart');
const Product=require('../models/product')

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: 'rzp_test_RJf3MNDoHKza5M',
  key_secret: 'gcdfcHLWnt5eJrPOUwfjCsQC'
});

exports.getCheckout = async (req, res) => {
  const userId = req.session.userId;
  const cart = await Cart.findOne({ userId }).populate('items.productId');
  const cartItems = cart ? cart.items : [];
  const discount = req.session.discount || 0;
  const totalAmount = cartItems.reduce((total, item) => total + item.price * item.quantity, 0) - discount;

  res.render('client/checkout', { cartItems, totalAmount });
};

exports.placeOrder = async (req, res) => {
  const { fullName, address, city, postalCode, country, paymentMethod } = req.body;
  const userId = req.session.userId;
  const cart = await Cart.findOne({ userId }).populate('items.productId');

  if (!cart) return res.status(400).json({ message: 'No items in cart.' });

  const discount = req.session.discount || 0;
  const totalAmount = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0) - discount;

  if (paymentMethod === 'COD') {
    // Handle Cash on Delivery
    const newOrder = new Order({
      userId,
      items: cart.items.map(item => ({
        productId: item.productId._id,
        name: item.productId.name,
        price: item.productId.price,
        quantity: item.quantity
      })),
      totalAmount,
      shippingAddress: { address, city, postalCode, country },
      paymentMethod,
      paymentStatus: 'Paid' // Assume COD is always paid after delivery
    });

    await newOrder.save();
    await Cart.findOneAndDelete({ userId });
    req.session.discount = 0;
    for (let item of cart.items) {
      const product = await Product.findById(item.productId._id);
      if (product.stock >= item.quantity) {
        product.stock -= item.quantity;
        await product.save();
      } else {
        return res.status(400).json({ message: `${product.name} is out of stock.` });
      }
    }
    return res.redirect('/order-confirmation');
  } else if (paymentMethod === 'Razorpay') {
    // Create Razorpay order
    const options = {
      amount: totalAmount * 100, 
      currency: 'INR',
      receipt: `order_rcptid_${Date.now()}`,
    };

    try {
      const razorpayOrder = await razorpay.orders.create(options);
      console.log("Razorpay Order:", razorpayOrder);

      // Store order details in session for verification later
      req.session.orderDetails = {
        fullName,
        address,
        city,
        postalCode,
        country,
        paymentMethod,
        razorpayOrderId: razorpayOrder.id,
        totalAmount
      };

      res.render('client/razorpayPayment', {
        orderId: razorpayOrder.id,
        amount: options.amount,
        currency: options.currency
      });
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      res.status(500).send('Error processing payment.');
    }
  } else {
    res.status(400).send('Invalid payment method selected.');
  }
};

exports.orderConfirmation = (req, res) => {
  res.render('client/confirmation');
};
