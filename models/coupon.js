// models/coupon.js
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discount: { type: Number, required: true }, 
  isActive: { type: Boolean, default: true }, 
  expirationDate: { type: Date }, 
});

module.exports = mongoose.model('Coupon', couponSchema);
