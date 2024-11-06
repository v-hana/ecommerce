const product = require('../models/product');
const Cart = require('../models/cart');
const Product=require('../models/product')
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
      return res.status(404).send('Product not found');
    }

    res.render('client/productDetail', { product });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};