const Cart = require('../models/cart');
const Product = require('../models/product');
const Coupon=require('../models/coupon')

exports.addToCart = async (req, res) => {
  const { productId } = req.body;
  console.log('Product ID:', productId);
  const userId = req.session.userId;
  console.log('User ID:', userId);
  try {
      // Find the product by its ID
      const product = await Product.findById(productId);
      if (!product) {
          return res.status(404).json({ message: 'This product is currently unavailable. Please check back later.' });
      }

      let cart = await Cart.findOne({ userId });
      if (!cart) {
          cart = new Cart({ userId, items: [] });
      }

      // Check if the item is already in the cart
      const existingItem = cart.items.find(item => item.productId.toString() === productId);
      if (existingItem) {
          existingItem.quantity++;
      } else {
          // Add new item with required fields
          cart.items.push({
              productId,
              quantity: 1,
              price: product.price,   // Add product price
              image: product.image,   // Add product image
              name: product.name       // Add product name
          });
      }

    await cart.save().catch(err => {
      console.error('Error saving cart:', err)
    });;
      res.status(200).json({ message: 'Item added to cart successfully!' });
  } catch (err) {
      console.error('Error adding item to cart:', err);
      res.status(500).json({ message: 'Error adding item to cart.' });
  }
};
exports.getCart = async (req, res) => {
    const userId = req.session.userId;
    try {
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        res.render('client/cart', { cartItems: cart ? cart.items : [] });
    } catch (err) {
        res.render('client/cart', { cartItems: [] });
    }
};
exports.updateQuantity = async (req, res) => {
    const { productId, action } = req.body;
    const userId = req.session.userId;

    try {
        // Find the user's cart
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found.' });
        }

        // Find the item in the cart
        const item = cart.items.find(item => item.productId.toString() === productId);

        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found in cart.' });
        }

        // Update quantity based on action
        if (action === 'increment') {
            item.quantity++;
        } else if (action === 'decrement') {
            if (item.quantity > 1) {
                item.quantity--;
            } else {
                // Remove item if quantity reaches zero
                cart.items = cart.items.filter(item => item.productId.toString() !== productId);
            }
        } else {
            return res.status(400).json({ success: false, message: 'Invalid action.' });
        }

        // Save updated cart
        await cart.save();

        // Recalculate subtotal
        const updatedSubtotal = cart.items.reduce(
            (total, item) => total + item.quantity * item.price, // Ensure `price` exists in the cart schema
            0
        );

        // Response object
        const response = {
            success: true,
            newQuantity: item.quantity,
            newTotalForItem: item.quantity * item.price,
            updatedSubtotal: updatedSubtotal
        };

        res.status(200).json(response);
    } catch (err) {
        console.error('Error updating cart quantity:', err);
        res.status(500).json({ success: false, message: 'Error updating cart.' });
    }
};

exports.applyCoupon = async (req, res) => {
  const { couponCode } = req.body;
  const userId = req.session.userId;

  try {
      const coupon = await Coupon.findOne({
          code: couponCode,
          isActive: true,
          expirationDate: { $gte: new Date() }
      });

      if (!coupon) {
          return res.status(404).json({ success: false, message: 'Invalid or expired coupon.' });
      }

      // Calculate the discount and new total based on the cart items
      const cart = await Cart.findOne({ userId }).populate('items.productId');
      const subtotal = cart.items.reduce((total, item) => total + item.productId.price * item.quantity, 0);
      const discountAmount = (subtotal * coupon.discount) / 100; // assuming discount is a percentage
      const totalAfterDiscount = subtotal - discountAmount;
      req.session.discount = discountAmount;
      res.status(200).json({
          success: true,
          discount: discountAmount.toFixed(2), // format discount to 2 decimal places
          newTotal: totalAfterDiscount.toFixed(2) // format new total to 2 decimal places
      });
  } catch (err) {
      console.error('Error applying coupon:', err);
      res.status(500).json({ success: false, message: 'Error applying coupon.' });
  }
};
