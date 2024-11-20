const product = require('../models/product');
const Cart = require('../models/cart');
const Product = require('../models/product')
const User = require('../models/user')
const Order= require('../models/order')
//views
exports.productsView = async (req, res) => {
  const products = await product.find()
  console.log(products);
  
  res.render('client/products',{products})
}

//home
exports.getHomePage = (req, res) => {
  res.render("client/home");
};

//aboutUs
exports.getAboutUsPage = (req, res) => {
  res.render("client/aboutUs");
};

//services
exports.getServicePage = (req, res) => {
  res.render("client/service");
}

//blog
exports.getBlogPage = (req, res) => {
  res.render("client/blog");
}

//contactUs
exports.getContactPage = (req, res) => {
  res.render("client/contact");
}

//Products Detailed view
exports.getProductDetail = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'This product is currently unavailable. Please check back later.' });
    }

    res.render('client/productDetail', { product });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

exports.getProfile = async (req, res) => {
  try {
      // Check if req.user exists (this should always be true if isAuthenticated middleware works)
      if (!req.session.userId) {
          return res.status(401).send('User not authenticated');
      }

      // Fetch user profile by ID
      const user = await User.findById(req.session.userId);
      
      // If user not found, handle accordingly
      if (!user) {
          return res.status(404).send('User not found');
      }

      // Render profile view with user data
      res.render('client/profile', { user });
  } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).send('Server Error');
  }
};
exports.getOrders = async (req, res) => {

  try { 
      // Check if req.user exists
      if (!req.session.userId) {
          return res.status(401).send('User not authenticated');
    }
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).send('User not found');
    }
    
    req.user = user;  // Set the user object to req.user

      
      // Fetch orders for the logged-in user
      const orders = await Order.find({ userId: req.user._id }).populate('items.productId');
      
      // Render orders view with the orders data
      res.render('client/orders', { orders });
  } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).send('Server Error');
  }
};
