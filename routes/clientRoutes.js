const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { isAuthenticated } = require('../middleware/auth');

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

// Profile route
router.get('/profile', isAuthenticated,clientController.getProfile);

// Orders route
router.get('/orders', isAuthenticated,clientController.getOrders)

module.exports = router;
