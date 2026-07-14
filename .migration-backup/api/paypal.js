// /api/paypal is not a direct endpoint.
// Use POST /api/paypal/orders to create an order.
// Use POST /api/paypal/orders/:orderId/capture to capture.
module.exports = (req, res) => {
  res.status(405).json({
    success: false,
    error: 'Method Not Allowed. Use POST /api/paypal/orders to create an order.',
  });
};
