const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

//product
// router.get('/', productController.getAllProducts);
// router.post('/add', productController.addProduct);
//views
// router.get('/add', productController.getAddProductForm);
router.get('/products',clientController.productsView)

//profile


//home

//cart
router.post('/add-to-cart', (req, res) => {
  const item = req.body; // Item data from frontend
  if (!req.session.cart) {
      req.session.cart = []; // Initialize the cart if it doesn't exist
  }
  console.log(item,'cart');
  
  // Add the item to the session cart
  req.session.cart.push(item);
  res.json({ success: true, cart: req.session.cart });
});
// Assume you have some way to manage cart items, e.g., in a session
router.get('/cart', (req, res) => {
  const cartItems = req.session.cart || []; // Example from session
  console.log(cartItems, 'popo');
  res.render('client/cart', { cartItems });
});



module.exports = router;
