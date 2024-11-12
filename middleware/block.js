const User = require('../models/user');

const isAuthenticated = async (req, res, next) => {
    if (req.session.userId) {
        const user = await User.findById(req.session.userId);

        if (user && user.isBlocked) {
            // If user is blocked, destroy the session and prevent access
            req.session.destroy(err => {
                if (err) console.error(err);
                return res.redirect('/auth/login?error=Your account has been blocked.');
            });
        } else {
            return next();
        }
    } else {
        res.redirect('/auth/login');
    }
};

module.exports = { isAuthenticated };