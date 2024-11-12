const Product = require('../models/product');
const Order = require('../models/order'); // Assuming you have an Order model
const User = require('../models/user');   // Assuming you have a User model
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const Admin = require('../models/adminModel');


// Controller to handle admin login
exports.getLoginpage = (req, res, next) => {
  res.render('admin/login');
};

exports.postAdminLogin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const adminUser = await Admin.findOne({ username });
    if (adminUser && await bcrypt.compare(password, adminUser.password)) {
      req.session.isAuthenticated = true;
      req.session.adminUser = adminUser.username; 
      res.redirect('/admin/overview');
    } else {
      res.status(401).send('Incorrect username or password');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

exports.addAdminUser = async (req, res) => {
  const { username, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const newAdmin = new Admin({
    username,
    password: hashedPassword,
  });

  try {
    await newAdmin.save();
    res.status(201).send('Admin user created successfully.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

exports.getOverview = async (req, res) => {
  try {
    
    const totalProducts = await Product.countDocuments(); 
    const totalOrders = await Order.countDocuments();   
    const lowStock = await Product.countDocuments({ stock: { $lt: 5 } }); 
    const totalUsers = await User.countDocuments();      
    res.render("admin/overview", {
      totalProducts,
      totalOrders,
      lowStock,
      totalUsers,
      recentActivities: [
        "Added a new product",
        "Updated stock for product ID 123",
        "Deleted product ID 456"
      ]
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

exports.getAddProduct = (req, res, next) => {
  res.render('admin/add-product',{ errors: {}, name: '', price: '', stock: '', description: '' });
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, 'public/uploads'); 
  },
  filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)); // Unique filename
  }
});

// Initialize multer
const upload = multer({ storage: storage });

// Export the multer middleware to be used in routes
exports.upload = upload.single('image');

// Controller function to add a product
exports.addProduct = async (req, res, next) => {
  const { name, price, stock, description } = req.body;
  const image = req.file ? req.file.filename : null;
  let errors = {};

    if (!name) errors.name = 'Product name is required';
    if (!price) errors.price = 'Price is required';
    if (!stock) errors.stock = 'Stock quantity is required';
    if (!description) errors.description = 'Description is required';
    if (!image) errors.image = 'Product image is required';

  if (Object.keys(errors).length > 0) {
    return res.render('admin/add-product', { errors, name, price, stock, description });
  }
  const newProduct = new Product({
      name,
      price,
      stock,
      description,
      image 
  });
 
  try {
      await newProduct.save();
      res.redirect('/admin/product-list'); 
  } catch (error) {
      console.error('error saving product:',error);
      res.status(500).send('Server Error');
  }
};


exports.getEditProduct = async (req, res, next) => {
  try {
      const product = await Product.findById(req.params.id);
      if (!product) {
          return res.status(404).send('Product not found');
      }
      res.render('admin/edit-product', { product });
  } catch (err) {
      console.log(err);
      res.status(500).send('Server error');
  }
};

exports.postEditProduct = async (req, res, next) => {
  const { name, price, stock, description } = req.body;
  let updatedImage = req.file ? req.file.filename : null;

  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).send('Product not found');
    }

    // If a new image is uploaded, remove the old one from the filesystem
    if (updatedImage) {
      if (product.image) {
        fs.unlinkSync(path.join(__dirname, '..', 'public', 'uploads', product.image)); // delete old image
      }
      product.image = updatedImage; // update the image field with the new filename
    }

    // Update other product fields
    product.name = name;
    product.price = price;
    product.stock = stock;
    product.description = description;

    await product.save(); 

    res.redirect('/admin/product-list');
  } catch (err) {
    console.log(err);
    res.status(500).send('Server error');
  }
};

exports.postDeleteProduct = async (req, res, next) => {
  try {
      await Product.findByIdAndDelete(req.params.id);
      res.redirect('/admin/product-list');
  } catch (err) {
      console.log(err);
      res.status(500).send('Server error');
  }
};

exports.getProductList = async (req, res, next) => {
    try {
        const products = await Product.find();
        res.render('admin/product-list', { products });
    } catch (err) {
        console.log(err);
        res.status(500).send('Server error');
    }
};

exports.getStock = async (req, res, next) => {
    try {
        const lowStockProducts = await Product.find({ stock: { $lt: 5 } });
        res.render('admin/stock', { lowStockProducts });
    } catch (err) {
        console.log(err);
        res.status(500).send('Server error');
    }
};

exports.getUserOverview = async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await User.find();

    // Render the userOverview view with the list of users
    res.render('admin/userOverview', { users });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
}

exports.getUserOrders = async (req, res) => {
  const userId = req.params.id;
  try {
      
    const orders = await Order.find({ userId });
    console.log(orders)
    res.render('admin/user-orders', { orders });
  } catch (error) {
      res.status(500).json({ message: 'Error fetching orders' });
  }
};

// Toggle block/unblock status for a user
exports.toggleBlockUser = async (req, res) => {
  try {
      const user = await User.findById(req.params.id);
      if (!user) {
          return res.status(404).json({ message: "User not found" });
      }

      // Toggle the isBlocked status
      user.isBlocked = !user.isBlocked;
      await user.save();

      const message = user.isBlocked ? 'User has been blocked.' : 'User has been unblocked.';
      res.json({ message });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
  }
};

// Display a specific order's details
exports.getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).send('Order not found');
    }

    res.render('admin/order-details', { order });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;
console.log(status);

  try {
      const order = await Order.findById(orderId);
      if (order) {
          order.status = status;
          await order.save();
        res.json({ success: true, message: 'Order status updated successfully.' });
       
      } else {
          res.status(404).json({ success: false, message: 'Order not found.' });
      }
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Error updating order status.' });
  }
};

exports.getOrderManagement = async (req, res) => {
  try {
      // Fetch all orders and sort them by date (latest first)
      const orders = await Order.find().sort({ orderDate: -1 }); // Sort by 'orderDate' descending
      res.render('admin/order-management', { orders });
  } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
  }
};

exports.setNoCacheHeaders = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
};
