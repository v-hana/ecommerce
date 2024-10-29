const product = require('../models/product');
const Product = require('../models/product');
const Cart = require('../models/cart');
//views
exports.productsView = async (req, res) => {
  const products = await product.find()
  console.log(products);
  
  res.render('client/products',{products})
}

//cart

// controllers/cartController.js
exports.getCart = async (req, res) => {
  const userId = req.user ? req.user._id : null; // Add a check to avoid undefined error

  if (!userId) {
      return res.status(401).send('User not authenticated');
  }

  try {
      const cart = await Cart.findOne({ userId }).populate('items.productId');
      res.render('client/cart', { cartItems: cart ? cart.items : [] });
  } catch (error) {
      console.error('Error retrieving cart:', error);
      res.status(500).send('Error retrieving cart items');
  }
};

exports.addToCart = async (req, res) => {
  const { productId } = req.body;
  const userId = req.user ? req.user._id : null;

  if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
  }

  try {
      const product = await Product.findById(productId);
      if (!product) {
          return res.status(404).json({ success: false, message: 'Product not found' });
      }

      let cart = await Cart.findOne({ userId });

      if (!cart) {
          cart = new Cart({
              userId,
              items: [{
                  productId,
                  name: product.name,
                  image: product.image,
                  price: product.price,
                  quantity: 1,
                  total: product.price
              }]
          });
      } else {
          const itemIndex = cart.items.findIndex(item => item.productId.equals(productId));
          if (itemIndex > -1) {
              cart.items[itemIndex].quantity += 1;
              cart.items[itemIndex].total = cart.items[itemIndex].price * cart.items[itemIndex].quantity;
          } else {
              cart.items.push({
                  productId,
                  name: product.name,
                  image: product.image,
                  price: product.price,
                  quantity: 1,
                  total: product.price
              });
          }
      }

      await cart.save();
      res.json({ success: true, message: 'Product added to cart', cart });
  } catch (error) {
      console.error('Error adding product to cart:', error);
      res.status(500).json({ success: false, error: 'Failed to add product to cart' });
  }
};
// controllers/cartController.js
exports.removeFromCart = async (req, res) => {
  const { productId } = req.body;
  const userId = req.user._id;

  try {
      const cart = await Cart.findOne({ userId });
      if (cart) {
          cart.items = cart.items.filter(item => !item.productId.equals(productId));
          await cart.save();
          res.json({ success: true, message: 'Product removed from cart', cart });
      } else {
          res.status(404).json({ success: false, message: 'Cart not found' });
      }
  } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to remove product from cart' });
  }
};


