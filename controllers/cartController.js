const Cart = require('../models/cart');
const Product = require('../models/product');
const Coupon=require('../models/coupon')

exports.addToCart = async (req, res) => {
  const { productId } = req.body;
  console.log('Product ID:', productId);
  const userId = req.session.userId;
  console.log('User ID:', userId);
  try {
      const product = await Product.findById(productId);
      if (!product) {
          return res.status(404).json({ message: 'This product is currently unavailable. Please check back later.' });
      }

      let cart = await Cart.findOne({ userId });
      if (!cart) {
          cart = new Cart({ userId, items: [] });
      }

      const existingItem = cart.items.find(item => item.productId.toString() === productId);
      if (existingItem) {
          existingItem.quantity++;
      } else {
          cart.items.push({
              productId,
              quantity: 1,
              price: product.price,  
              image: product.image,   
              name: product.name       
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
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found.' });
        }

        const item = cart.items.find(item => item.productId.toString() === productId);

        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found in cart.' });
        }

        if (action === 'increment') {
            item.quantity++;
        } else if (action === 'decrement') {
            if (item.quantity > 1) {
                item.quantity--;
            } else {
                cart.items = cart.items.filter(item => item.productId.toString() !== productId);
            }
        } else {
            return res.status(400).json({ success: false, message: 'Invalid action.' });
        }

        await cart.save();

        const updatedSubtotal = cart.items.reduce(
            (total, item) => total + item.quantity * item.price,0 );

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

      
      const cart = await Cart.findOne({ userId }).populate('items.productId');
      const subtotal = cart.items.reduce((total, item) => total + item.productId.price * item.quantity, 0);
      const discountAmount = (subtotal * coupon.discount) / 100; 
      const totalAfterDiscount = subtotal - discountAmount;
      req.session.discount = discountAmount;
      res.status(200).json({
          success: true,
          discount: discountAmount.toFixed(2), 
          newTotal: totalAfterDiscount.toFixed(2) 
      });
  } catch (err) {
      console.error('Error applying coupon:', err);
      res.status(500).json({ success: false, message: 'Error applying coupon.' });
  }
};
