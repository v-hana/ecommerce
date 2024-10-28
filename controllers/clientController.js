const product = require('../models/product');
const Product = require('../models/product');
//views
exports.productsView = async (req, res) => {
  const products = await product.find()
  console.log(products);
  
  res.render('client/products',{products})
}

//cart


