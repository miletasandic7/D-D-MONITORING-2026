const { createPayPalOrder, capturePayPalOrder } = require('../../paypal');

module.exports = async (req, res) => {
  const { orderId } = req.query || {};

  // Handle /api/paypal/orders/:orderId/capture (POST - capture order)
  if (orderId !== undefined) {
    if (req.method !== 'POST') {
      res.status(405).json({ success: false, error: 'Method Not Allowed' });
      return;
    }

    try {
      const capture = await capturePayPalOrder(orderId);
      res.status(200).json({ success: true, status: capture.status, capture });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
    return;
  }

  // Handle /api/paypal/orders (POST - create order)
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  try {
    const order = await createPayPalOrder(req.body || {});
    res.status(200).json({ success: true, id: order.id, status: order.status, order });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
