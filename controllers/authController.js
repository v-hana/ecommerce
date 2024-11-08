const User = require('../models/user');
const { validationResult } = require('express-validator');

exports.getSignup = (req, res) => {
    res.render('client/signup', { error: null });
};

exports.postSignup = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = {};
        errors.array().forEach(error => {
            console.log(error, 'err');
            
            errorMessages[error.path] = error.msg;
        });
        console.log(errors, 'helo');
        
        console.log(errorMessages, 'err message');
        
        return res.render('client/signup', { error: errorMessages });
    }

    try {
        const { username, email, password } = req.body;
        const newUser = new User({ username, email, password });
        await newUser.save();
        res.redirect('/auth/login');
    } catch (err) {
        res.render('client/signup', { error: 'Error signing up, please try again.' });
    }
};

exports.getLogin = (req, res) => {
    res.render('client/login', { errorMessages: {}  });
};

exports.postLogin = async (req, res) => {
    const errors = validationResult(req);
    const errorMessages = {};

    // Handle validation errors from express-validator
    if (!errors.isEmpty()) {
       
        errors.array().forEach(error => {
            errorMessages[error.path] = error.msg; // Use 'param' to get the input field name
        });
        return res.render('client/login', { errorMessages });
    }
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            errorMessages.email = 'Invalid email or password.'; // Add error message for email field
            return res.render('client/login', { errorMessages });
            
        }
        if (user.isBlocked) {
            return res.status(403).json({ message: 'Your account has been blocked. Contact support for assistance.' });
          }
      
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            errorMessages.password = 'Invalid email or password.'; // Add error message for password field
            return res.render('client/login', { errorMessages });
        }

        req.session.userId = user._id; // Store user ID in session
        res.redirect('/home');
    } catch (err) {
        res.render('client/login', { error: 'Error logging in, please try again.' });
    }
};

exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/products');
        }
        res.redirect('/auth/login');
    });
};

