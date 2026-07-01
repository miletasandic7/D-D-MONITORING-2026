const { createPayPalOrder } = require('../../paypal');

module.exports = async (req, res) => {
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
