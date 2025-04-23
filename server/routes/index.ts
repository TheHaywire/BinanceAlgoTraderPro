import { Router } from "express";
import strategyRoutes from "./strategies";
import performanceRoutes from "./performance";

const router = Router();

// Mount strategy routes
router.use("/strategies", strategyRoutes);

// Mount performance routes
router.use("/performance", performanceRoutes);

export default router;