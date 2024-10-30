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


module.exports = router;
