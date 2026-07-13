import { Router, type IRouter } from "express";
import { GetAiStatusResponse } from "@workspace/api-zod";
import {
  iiotHazardModelMetrics,
  turbofanRulFeatureOrder,
  turbofanRulModelMetrics,
} from "@workspace/ml-models";
import { getHazardAiStatus } from "../lib/hazardAI";

const router: IRouter = Router();

router.get("/ai/status", async (_req, res): Promise<void> => {
  const scanStatus = getHazardAiStatus();

  const result = {
    models: [
      {
        name: "Live Hazard Failure Classifier",
        kind: "classifier" as const,
        version: "iiot-mlp-v1",
        trainedOn: "IIoT Edge Computing Dataset (1,000 telemetry samples, 5 sensors)",
        features: ["temperature", "pressure", "vibration", "controlConfidence"],
        metrics: iiotHazardModelMetrics,
      },
      {
        name: "Turbofan Remaining Useful Life Regressor",
        kind: "regressor" as const,
        version: "turbofan-mlp-v1",
        trainedOn: "NASA C-MAPSS FD001 turbofan degradation dataset (100 engine run-to-failure trajectories)",
        features: [...turbofanRulFeatureOrder],
        metrics: turbofanRulModelMetrics,
      },
    ],
    lastScanAt: scanStatus.lastScanAt,
    zonesScored: scanStatus.zonesScored,
  };

  res.json(GetAiStatusResponse.parse(result));
});

export default router;
