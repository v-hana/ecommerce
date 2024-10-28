const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Order schema
const orderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId, // Reference to the User model
        ref: 'User',
        required: true
    },
    products: [
        {
            product: { type: Schema.Types.ObjectId, ref: 'Product', required: true }, // Reference to the Product model
            quantity: { type: Number, required: true }
        }
    ],
    totalPrice: {
        type: Number,
        required: true
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        default: 'Pending', // e.g., Pending, Shipped, Delivered, Canceled
        enum: ['Pending', 'Shipped', 'Delivered', 'Canceled']
    }
});

module.exports = mongoose.model('Order', orderSchema);
