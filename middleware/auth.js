const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
      return next();
  }
  res.redirect('/login'); // Redirect to login page if not authenticated
};

module.exports = isAuthenticated;
