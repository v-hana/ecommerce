const Order = require('../models/order');
const Cart = require('../models/cart');

exports.getCheckout = async (req, res) => {
  const userId = req.session.userId;
  const cart = await Cart.findOne({ userId }).populate('items.productId');
  const cartItems = cart ? cart.items : [];
  const totalAmount = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  
  res.render('client/checkout', { cartItems, totalAmount });
};

exports.placeOrder = async (req, res) => {
  const { address, city, postalCode, country } = req.body;
  const userId = req.session.userId;
  const cart = await Cart.findOne({ userId }).populate('items.productId');
  
  if (!cart) return res.status(400).json({ message: 'No items in cart.' });

  const totalAmount = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
    paymentStatus: 'Pending'
  });

  await newOrder.save();
  await Cart.findOneAndDelete({ userId });  // Clear cart after order
  res.redirect('/order-confirmation');
};

exports.orderConfirmation = (req, res) => {
  res.render('client/order');
};
