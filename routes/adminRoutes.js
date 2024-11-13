const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated } = require('../middleware/admin');
const upload = adminController.upload;

router.get('/login',adminController.getLoginpage)
// Route for handling admin login
router.post('/login', adminController.postAdminLogin);

// Route for adding a new admin user (for initial setup)
router.post('/add-admin', adminController.addAdminUser);

 

// Get Overview
router.get('/overview',isAuthenticated,adminController.setNoCacheHeaders,adminController.getOverview);
// Add New Product
router.get('/add-product',  isAuthenticated,adminController.setNoCacheHeaders,adminController.getAddProduct);
router.post('/add-product', adminController.upload, adminController.addProduct);


// Edit Product
router.get('/edit-product/:id',  isAuthenticated, adminController.setNoCacheHeaders,adminController.getEditProduct);
router.post('/edit-product/:id', upload, adminController.postEditProduct);

// Delete Product
router.post('/delete-product/:id', adminController.postDeleteProduct);

// Product List
router.get('/product-list',  isAuthenticated,adminController.setNoCacheHeaders,adminController.getProductList);

router.get('/userOverview', isAuthenticated,adminController.setNoCacheHeaders,adminController.getUserOverview)

// Route to view orders for a specific user
router.get('/user/:id/orders',  isAuthenticated,adminController.setNoCacheHeaders,adminController.getUserOrders);

// View Order Details
router.get('/orders/:id',  isAuthenticated,adminController.setNoCacheHeaders,adminController.getOrderDetails);

// Update Order Status
router.post('/order/:id/status',  isAuthenticated,adminController.updateOrderStatus);


// Route to block/unblock a user
router.post('/user/:id/block', adminController.toggleBlockUser);

router.get('/order-management', isAuthenticated, adminController.setNoCacheHeaders,adminController.getOrderManagement);

// Stock
router.get('/stock',  isAuthenticated,adminController.setNoCacheHeaders,adminController.getStock);

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/admin/overview');
        }
        res.redirect('/admin/login');
    });
});



module.exports = router;
