import { Router, type IRouter } from "express";
import healthRouter from "./health";
import settingsRouter from "./settings";
import membersRouter from "./members";
import monthsRouter from "./months";
import paymentsRouter from "./payments";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(settingsRouter);
router.use(membersRouter);
router.use(monthsRouter);
router.use(paymentsRouter);
router.use(dashboardRouter);

export default router;
