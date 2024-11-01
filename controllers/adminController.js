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


// Controller to handle admin login
exports.postAdminLogin = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find the admin user by username
    const adminUser = await Admin.findOne({ username });

    // Verify user exists and password is correct
    if (adminUser && await bcrypt.compare(password, adminUser.password)) {
      req.session.isAuthenticated = true;
      req.session.adminUser = adminUser.username; // store username in session
      res.redirect('overview');
    } else {
      res.status(401).send('Incorrect username or password');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};
// Method to add a new admin user (for initial setup)
exports.addAdminUser = async (req, res) => {
  const { username, password } = req.body;

  // Hash the password
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
    // Fetching data for the dashboard overview
    const totalProducts = await Product.countDocuments(); // Total number of products
    const totalOrders = await Order.countDocuments();     // Total number of orders
    const lowStock = await Product.countDocuments({ stock: { $lt: 5 } }); // Low stock products
    const totalUsers = await User.countDocuments();       // Total number of users

    // Pass the data to the overview view
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

// Add New Product
exports.getAddProduct = (req, res, next) => {
  res.render('admin/add-product');
};


// Set up storage for the uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, 'public/uploads'); // Directory to save the uploaded files
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

  const newProduct = new Product({
      name,
      price,
      stock,
      description,
      image // Save the image filename to the product document
  });

  try {
      await newProduct.save();
      res.redirect('/admin/product-list'); // Redirect to product list after adding
  } catch (error) {
      console.error('error saving product:',error);
      res.status(500).send('Server Error');
  }
};

// Edit Product
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

    await product.save(); // Save changes to MongoDB

    res.redirect('/admin/product-list');
  } catch (err) {
    console.log(err);
    res.status(500).send('Server error');
  }
};

// Delete Product
exports.postDeleteProduct = async (req, res, next) => {
  try {
      await Product.findByIdAndDelete(req.params.id);
      res.redirect('/admin/product-list');
  } catch (err) {
      console.log(err);
      res.status(500).send('Server error');
  }
};

// List Products
exports.getProductList = async (req, res, next) => {
    try {
        const products = await Product.find();
        res.render('admin/product-list', { products });
    } catch (err) {
        console.log(err);
        res.status(500).send('Server error');
    }
};

// Stock Management
exports.getStock = async (req, res, next) => {
    try {
        const lowStockProducts = await Product.find({ stock: { $lt: 5 } });
        res.render('admin/stock', { lowStockProducts });
    } catch (err) {
        console.log(err);
        res.status(500).send('Server error');
    }
};


