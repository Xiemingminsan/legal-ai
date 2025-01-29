const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // Extract the token from the "Authorization" header
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ msg: 'No token provided' });
  }

  // Ensure the token is in the "Bearer <token>" format
  const token = authHeader.split(' ')[1]; // Split the "Bearer" prefix
  if (!token) {
    return res.status(401).json({ msg: 'Invalid token format' });
  }

  try {
    // Verify the token using the secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach the decoded token payload to the request object
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(410).json({ msg: 'Invalid token' });
  }
};

module.exports = authMiddleware;
