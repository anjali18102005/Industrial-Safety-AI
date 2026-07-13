/**
 * Forward-pass inference for the two small MLPs trained on real datasets
 * (see /ml/train_iiot_hazard_model.py and /ml/train_turbofan_rul_model.py at
 * the repo root). Weights were learned with scikit-learn and exported as
 * plain TS constants -- this module just re-implements the same forward
 * pass (matmul + bias + activation) so inference runs natively in Node
 * with no extra runtime dependency.
 */
import { iiotHazardModel } from "./iiot-hazard-model";
import { turbofanRulModel } from "./turbofan-rul-model";

function relu(x: number[]): number[] {
  return x.map((v) => Math.max(0, v));
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/** y = W^T x + b, where W is [inputDim][outputDim] (sklearn coefs_ layout). */
function denseForward(input: number[], W: readonly (readonly number[])[], b: readonly number[]): number[] {
  const outDim = b.length;
  const out = new Array(outDim).fill(0);
  for (let i = 0; i < input.length; i++) {
    const wi = W[i];
    if (!wi) continue;
    const xi = input[i] ?? 0;
    for (let j = 0; j < outDim; j++) {
      out[j] += xi * (wi[j] ?? 0);
    }
  }
  for (let j = 0; j < outDim; j++) {
    out[j] += b[j] ?? 0;
  }
  return out;
}

function standardize(values: number[], mean: readonly number[], scale: readonly number[]): number[] {
  return values.map((v, i) => (v - (mean[i] ?? 0)) / (scale[i] ?? 1));
}

export interface HazardPrediction {
  /** Probability (0-1) the AI classifier assigns to an imminent failure/hazard condition. */
  probability: number;
  modelVersion: string;
  featuresUsed: readonly string[];
}

/**
 * Predicts live failure probability from temperature, pressure, vibration,
 * and control-loop (PID) confidence readings -- the four features the
 * classifier was actually trained on in the IIoT edge-computing dataset.
 */
export function predictHazardProbability(input: {
  temperature: number;
  pressure: number;
  vibration: number;
  controlConfidence: number;
}): HazardPrediction {
  const model = iiotHazardModel;
  const raw = [input.temperature, input.pressure, input.vibration, input.controlConfidence];
  const x = standardize(raw, model.scalerMean, model.scalerScale);
  const hidden = relu(denseForward(x, model.W1, model.b1));
  const output = denseForward(hidden, model.W2, model.b2);
  const probability = sigmoid(output[0] ?? 0);
  return {
    probability,
    modelVersion: "iiot-mlp-v1",
    featuresUsed: model.features,
  };
}

export const iiotHazardModelMetrics = iiotHazardModel.metrics;

export interface RulPrediction {
  /** Predicted remaining useful life in cycles, capped at the model's training cap. */
  predictedRul: number;
  cappedAt: number;
  modelVersion: string;
}

/**
 * Predicts Remaining Useful Life (in operating cycles) from a turbofan
 * engine's operational-setting and sensor feature vector, using the same
 * feature order the model was trained on (see turbofanRulModel.features).
 */
export function predictRul(features: readonly number[]): RulPrediction {
  const model = turbofanRulModel;
  const x = standardize([...features], model.scalerMean, model.scalerScale);
  const h1 = relu(denseForward(x, model.W1, model.b1));
  const h2 = relu(denseForward(h1, model.W2, model.b2));
  const output = denseForward(h2, model.W3, model.b3);
  const predictedRul = Math.max(0, output[0] ?? 0);
  return {
    predictedRul,
    cappedAt: model.ruCap,
    modelVersion: "turbofan-mlp-v1",
  };
}

export const turbofanRulModelMetrics = turbofanRulModel.metrics;
export const turbofanRulFeatureOrder = turbofanRulModel.features;
