// middleware/authMiddleware.js

const isAuthenticated = (req, res, next) => {
  // Check if the session contains isAuthenticated flag
  if (req.session.isAuthenticated) {
      return next(); // If user is authenticated, allow access to the route
  }
  res.redirect('/admin/login'); // If not authenticated, redirect to login page
};

module.exports = { isAuthenticated };
