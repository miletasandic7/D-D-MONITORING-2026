import { Router, type IRouter } from "express";
import healthRouter from "./health";
import camerasRouter from "./cameras";
import incidentsRouter from "./incidents";
import searchRouter from "./search";
import paypalRouter from "./paypal";

const router: IRouter = Router();

router.use(healthRouter);
router.use(camerasRouter);
router.use(incidentsRouter);
router.use(searchRouter);
router.use(paypalRouter);

export default router;
