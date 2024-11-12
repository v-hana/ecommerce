
module.exports.isAuthenticated = (req, res, next) => {
  if (req.session && req.session.isAdmin) {
      return next();  // Proceed to the next middleware or route handler
  }
  res.redirect('/admin/login');  // Redirect to login if not authenticated
};
