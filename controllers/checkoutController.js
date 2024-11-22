const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/order');
const Cart = require('../models/cart');
const Product = require('../models/product');


const razorpay = new Razorpay({
  key_id: 'rzp_test_RJf3MNDoHKza5M',
  key_secret: 'gcdfcHLWnt5eJrPOUwfjCsQC'
})


exports.getCheckout = async (req, res) => {
  const userId = req.session.userId;
  const cart = await Cart.findOne({ userId }).populate('items.productId');
  const cartItems = cart ? cart.items : [];
  const discount = req.session.discount || 0;
  const totalAmount = cartItems.reduce((total, item) => total + item.price * item.quantity, 0) - discount;

  res.render('client/checkout', { cartItems, totalAmount });
};


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
  await Cart.findOneAndDelete({ userId });

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
      req.session.discount = 0; 
      return res.redirect('/order-confirmation');
    } catch (error) {
      console.error('Error processing COD order:', error);
      return res.status(500).send(error.message);
    }
  } else if (paymentMethod === 'Razorpay') {
    const amountInPaise = Math.round(totalAmount * 100); 
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `order_rcptid_${Date.now()}`,
    };

    try {
      const razorpayOrder = await razorpay.orders.create(options);

      
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


exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  
  const generatedSignature = crypto
    .createHmac('sha256', razorpay.key_secret)
    .update(razorpay_order_id + '|' + razorpay_payment_id)
    .digest('hex');

  if (generatedSignature !== razorpay_signature) {
    return res.status(400).json({ message: 'Payment verification failed.' });
  }

  
  const orderDetails = req.session.orderDetails;
  if (!orderDetails) {
    return res.status(400).json({ message: 'Order details not found in session.' });
  }

  try {
    const userId = req.session.userId;
    const cart = await Cart.findOne({ userId }).populate('items.productId');

    if (!cart) return res.status(400).json({ message: 'No items in cart.' });

    
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
    req.session.discount = 0;
    req.session.orderDetails = null;

    res.json({ message: 'Payment successful' });
  } catch (error) {
    console.error('Error processing order:', error);
    return res.status(500).json({ message: 'Error saving order details.' });
  }
};


exports.orderConfirmation = (req, res) => {
  res.render('client/confirmation');
};
