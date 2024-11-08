const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const upload = adminController.upload;

router.get('/login',adminController.getLoginpage)
// Route for handling admin login
router.post('/login', adminController.postAdminLogin);

// Route for adding a new admin user (for initial setup)
router.post('/add-admin', adminController.addAdminUser);


// Get Overview
router.get('/overview', adminController.getOverview);
// Add New Product
router.get('/add-product', adminController.getAddProduct);
router.post('/add-product', adminController.upload, adminController.addProduct);


// Edit Product
router.get('/edit-product/:id', adminController.getEditProduct);
router.post('/edit-product/:id', upload, adminController.postEditProduct);

// Delete Product
router.post('/delete-product/:id', adminController.postDeleteProduct);

// Product List
router.get('/product-list', adminController.getProductList);

router.get('/userOverview',adminController.getUserOverview)

// Route to view orders for a specific user
router.get('/user/:id/orders', adminController.getUserOrders);

// View Order Details
router.get('/orders/:id', adminController.getOrderDetails);

// Update Order Status
router.post('/order/:id/status', adminController.updateOrderStatus);


// Route to block/unblock a user
router.post('/user/:id/block', adminController.toggleBlockUser);

// Stock
router.get('/stock', adminController.getStock);

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/admin/overview');
        }
        res.redirect('/admin/login');
    });
});



module.exports = router;
