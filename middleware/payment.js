const crypto = require('crypto');

exports.verifyPayment = (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const keySecret = 'gcdfcHLWnt5eJrPOUwfjCsQC';

  const hmac = crypto.createHmac('sha256', keySecret);
  hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const generatedSignature = hmac.digest('hex');

  if (generatedSignature === razorpay_signature) {
    return next();
  } else {
    return res.status(400).json({ success: false, message: 'Payment verification failed.' });
  }
};
