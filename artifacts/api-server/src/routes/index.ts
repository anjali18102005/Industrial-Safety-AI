import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import zonesRouter from "./zones";
import sensorsRouter from "./sensors";
import hazardsRouter from "./hazards";
import activityRouter from "./activity";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(zonesRouter);
router.use(sensorsRouter);
router.use(hazardsRouter);
router.use(activityRouter);

export default router;
