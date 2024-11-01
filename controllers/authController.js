const User = require('../models/user');
const { validationResult } = require('express-validator');

exports.getSignup = (req, res) => {
    res.render('client/signup', { error: null });
};

exports.postSignup = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('client/signup', { error: errors.array()[0].msg });
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
    res.render('client/login', { error: null });
};

exports.postLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('client/login', { error: 'Invalid email or password.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.render('client/login', { error: 'Invalid email or password.' });
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
