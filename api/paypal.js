const { createPayPalOrder, capturePayPalOrder } = require('../paypal');

// POST /api/paypal - create or capture PayPal order
module.exports = async (req, res) => {
  if (req.method === 'POST') {
    // Check if this is a capture request (orderId in body or query)
    const { orderId } = req.body || req.query || {};
    if (orderId) {
      // Capture existing order
      try {
        const result = await capturePayPalOrder(orderId);
        res.status(200).json({ success: true, status: result.status, capture: result });
      } catch (err) {
        res.status(400).json({ success: false, error: err.message });
      }
      return;
    }
    // Create new order
    try {
      const order = await createPayPalOrder(req.body || {});
      res.status(200).json({ success: true, id: order.id, status: order.status, order });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
    return;
  }

  res.status(405).json({
    success: false,
    error: 'Method Not Allowed. Use POST /api/paypal to create or capture an order.',
  });
};
