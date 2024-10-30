const product = require('../models/product');
const Cart = require('../models/cart');

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