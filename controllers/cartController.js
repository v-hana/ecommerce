const Cart = require('../models/cart');
const Product = require('../models/product');

exports.addToCart = async (req, res) => {
  const { productId } = req.body;
  console.log('Product ID:', productId);
  const userId = req.session.userId;
  console.log('User ID:', userId);
  try {
      // Find the product by its ID
      const product = await Product.findById(productId);
      if (!product) {
          return res.status(404).json({ message: 'Product not found.' });
      }

      let cart = await Cart.findOne({ userId });
      if (!cart) {
          cart = new Cart({ userId, items: [] });
      }

      // Check if the item is already in the cart
      const existingItem = cart.items.find(item => item.productId.toString() === productId);
      if (existingItem) {
          existingItem.quantity++;
      } else {
          // Add new item with required fields
          cart.items.push({
              productId,
              quantity: 1,
              price: product.price,   // Add product price
              image: product.image,   // Add product image
              name: product.name       // Add product name
          });
      }

    await cart.save().catch(err => {
      console.error('Error saving cart:', err)
    });;
      res.status(200).json({ message: 'Item added to cart successfully!' });
  } catch (err) {
      console.error('Error adding item to cart:', err);
      res.status(500).json({ message: 'Error adding item to cart.' });
  }
};
exports.getCart = async (req, res) => {
    const userId = req.session.userId;
    try {
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        res.render('client/cart', { cartItems: cart ? cart.items : [] });
    } catch (err) {
        res.render('client/cart', { cartItems: [] });
    }
};
exports.updateQuantity = async (req, res) => {
  const { productId, action } = req.body;
  const userId = req.session.userId;

  try {
      const cart = await Cart.findOne({ userId });

      if (!cart) {
          return res.status(404).json({ success: false, message: 'Cart not found.' });
      }

      const item = cart.items.find(item => item.productId.toString() === productId);
      
      if (!item) {
          return res.status(404).json({ success: false, message: 'Item not found in cart.' });
      }

      if (action === 'increment') {
          item.quantity++;
      } else if (action === 'decrement') {
          if (item.quantity > 1) {
              item.quantity--;
          } else {
              // Optional: remove the item if quantity is 1 and decremented
              cart.items = cart.items.filter(item => item.productId.toString() !== productId);
          }
      }

      await cart.save();
      res.status(200).json({ success: true, newQuantity: item.quantity });
  } catch (err) {
      console.error('Error updating cart quantity:', err);
      res.status(500).json({ success: false, message: 'Error updating cart.' });
  }
};

