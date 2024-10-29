// models/Cart.js
const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            name: { type: String, required: true },      // Product name
            image: { type: String, required: true },     // Image URL or path
            price: { type: Number, required: true },     // Price per unit
            quantity: { type: Number, default: 1 },      // Quantity of this item in cart
            total: { type: Number }                      // Total price (calculated on save/update)
        }
    ]
});

// Pre-save hook to calculate the total price per item
cartSchema.pre('save', function (next) {
    this.items.forEach(item => {
        item.total = item.price * item.quantity;
    });
    next();
});

module.exports = mongoose.model('Cart', cartSchema);
