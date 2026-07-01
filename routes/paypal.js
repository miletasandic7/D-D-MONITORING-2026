const express = require('express');
const { capturePayPalOrder, createPayPalOrder } = require('../paypal');

const router = express.Router();

router.post('/api/paypal/orders', async (req, res) => {
  try {
    const order = await createPayPalOrder(req.body || {});
    res.status(200).json({ success: true, id: order.id, status: order.status, order });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/api/paypal/orders/:orderId/capture', async (req, res) => {
  try {
    const capture = await capturePayPalOrder(req.params.orderId || req.body?.orderId);
    res.status(200).json({ success: true, status: capture.status, capture });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
