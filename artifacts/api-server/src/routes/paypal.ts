import { Router, type IRouter } from "express";
import { CreatePaypalOrderBody, CreatePaypalOrderResponse, CapturePaypalOrderParams, CapturePaypalOrderResponse } from "@workspace/api-zod";
import { createPayPalOrder, capturePayPalOrder } from "../lib/paypal";

const router: IRouter = Router();

router.post("/paypal/orders", async (req, res): Promise<void> => {
  const parsed = CreatePaypalOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.message });
    return;
  }

  try {
    const order = (await createPayPalOrder(parsed.data)) as { id: string; status: string };
    res.json(
      CreatePaypalOrderResponse.parse({
        success: true,
        id: order.id,
        status: order.status,
        order,
      }),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to create PayPal order");
    res.status(502).json({ success: false, error: (err as Error).message });
  }
});

router.post("/paypal/orders/:orderId/capture", async (req, res): Promise<void> => {
  const params = CapturePaypalOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ success: false, error: params.error.message });
    return;
  }

  try {
    const capture = (await capturePayPalOrder(params.data.orderId)) as { status: string };
    res.json(
      CapturePaypalOrderResponse.parse({
        success: true,
        status: capture.status,
        capture,
      }),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to capture PayPal order");
    res.status(502).json({ success: false, error: (err as Error).message });
  }
});

export default router;
