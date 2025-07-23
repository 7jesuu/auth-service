function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ message: "Not authenticated" });
}

function hasRole(roleName) {
  return (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role_name) {
      if (req.session.user.role_name === roleName) {
        return next();
      }
    }
    return res.status(403).json({ message: "Forbidden" });
  };
}

module.exports = {
  isAuthenticated,
  hasRole,
};
