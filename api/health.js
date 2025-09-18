// Vercel API function
module.exports = (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'July Spa API is running',
    timestamp: new Date().toISOString()
  });
};