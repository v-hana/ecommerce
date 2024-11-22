const product = require('../models/product');
const Cart = require('../models/cart');
const Product = require('../models/product')
const User = require('../models/user')
const Order= require('../models/order')

exports.productsView = async (req, res) => {
  const products = await product.find()
  console.log(products);
  
  res.render('client/products',{products})
}

exports.getHomePage = (req, res) => {
  res.render("client/home");
};

exports.getAboutUsPage = (req, res) => {
  res.render("client/aboutUs");
};

exports.getServicePage = (req, res) => {
  res.render("client/service");
}

exports.getBlogPage = (req, res) => {
  res.render("client/blog");
}

exports.getContactPage = (req, res) => {
  res.render("client/contact");
}

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
      
      if (!req.session.userId) {
          return res.status(401).send('User not authenticated');
      }

      
      const user = await User.findById(req.session.userId);
      
      
      if (!user) {
          return res.status(404).send('User not found');
      }

      
      res.render('client/profile', { user });
  } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).send('Server Error');
  }
};

exports.getOrders = async (req, res) => {

  try { 
      
      if (!req.session.userId) {
          return res.status(401).send('User not authenticated');
    }
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).send('User not found');
    }
    
    req.user = user;  
      const orders = await Order.find({ userId: req.user._id }).populate('items.productId');
      res.render('client/orders', { orders });
  } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).send('Server Error');
  }
};
