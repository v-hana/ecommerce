const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');


//product
// router.get('/', productController.getAllProducts);
// router.post('/add', productController.addProduct);
//views
// router.get('/add', productController.getAddProductForm);
router.get('/products',clientController.productsView)

//home
router.get('/home', clientController.getHomePage);

//aboutUs
router.get('/aboutUs', clientController.getAboutUsPage);

//services
router.get('/service',clientController.getServicePage)

//blog
router.get('/blog', clientController.getBlogPage);

//contactUs
router.get('/contact', clientController.getContactPage)

router.get('/products/:id', clientController.getProductDetail);
module.exports = router;
