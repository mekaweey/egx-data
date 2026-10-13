/**
 * Incremental/online learning: update model with one example at a time.
 * Useful for streaming data — no full retrain required.
 */

export interface OnlineLinearModel {
  weights: number[];
  bias: number;
  learningRate: number;
  l2: number;
  samplesSeen: number;
}

export function initOnlineModel(dim: number, lr: number = 0.01, l2: number = 0.0001): OnlineLinearModel {
  return { weights: new Array(dim).fill(0), bias: 0, learningRate: lr, l2, samplesSeen: 0 };
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-Math.max(Math.min(x, 30), -30)));
}

/** SGD step on a single (x, y) example for binary classification. */
export function partialFit(model: OnlineLinearModel, x: number[], y: number): OnlineLinearModel {
  const z = model.bias + x.reduce((s, xi, i) => s + xi * model.weights[i], 0);
  const pred = sigmoid(z);
  const err = pred - y;
  for (let i = 0; i < model.weights.length; i++) {
    model.weights[i] -= model.learningRate * (err * x[i] + model.l2 * model.weights[i]);
  }
  model.bias -= model.learningRate * err;
  model.samplesSeen++;
  return model;
}

export function predictOnline(model: OnlineLinearModel, x: number[]): number {
  const z = model.bias + x.reduce((s, xi, i) => s + xi * model.weights[i], 0);
  return sigmoid(z);
}

/** Adaptive learning rate that decays with samples seen. */
export function adaptLR(model: OnlineLinearModel, baseLR: number = 0.01): void {
  model.learningRate = baseLR / (1 + 0.001 * model.samplesSeen);
}