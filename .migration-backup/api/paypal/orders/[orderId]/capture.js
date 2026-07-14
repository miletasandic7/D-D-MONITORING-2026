const { capturePayPalOrder } = require('../../../../paypal');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  try {
    const orderId = req.query?.orderId || req.body?.orderId;
    const capture = await capturePayPalOrder(orderId);
    res.status(200).json({ success: true, status: capture.status, capture });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
