const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// User schema
const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'customer', // can be 'customer' or 'admin'
        enum: ['customer', 'admin']
    },
    address: {
        street: String,
        city: String,
        postalCode: String,
        country: String
    },
    orders: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Order'
        }
    ]
});

module.exports = mongoose.model('User', userSchema);
