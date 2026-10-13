/**
 * Neural ODE: model price as a continuous-time differential equation dx/dt = f(x, t).
 * Uses Euler integration for simplicity.
 */

export interface NeuralODEParams {
  weights: number[];
  bias: number;
}

/**
 * Drift function: dx/dt = f(x, t; params)
 */
function drift(x: number, t: number, params: NeuralODEParams): number {
  return Math.tanh(params.weights[0] * x + params.weights[1] * t + params.bias);
}

/**
 * Integrate ODE forward using 4th-order Runge-Kutta.
 */
export function integrateODE(
  x0: number,
  t0: number,
  t1: number,
  steps: number,
  params: NeuralODEParams,
): { trajectory: Array<{ t: number; x: number }>; final: number } {
  const dt = (t1 - t0) / steps;
  let x = x0;
  let t = t0;
  const trajectory: Array<{ t: number; x: number }> = [{ t, x }];

  for (let i = 0; i < steps; i++) {
    const k1 = drift(x, t, params);
    const k2 = drift(x + (dt * k1) / 2, t + dt / 2, params);
    const k3 = drift(x + (dt * k2) / 2, t + dt / 2, params);
    const k4 = drift(x + dt * k3, t + dt, params);
    x += (dt * (k1 + 2 * k2 + 2 * k3 + k4)) / 6;
    t += dt;
    trajectory.push({ t, x });
  }

  return { trajectory, final: x };
}

/**
 * Fit Neural ODE params to observed price trajectory.
 */
export function fitNeuralODE(
  observations: Array<{ t: number; x: number }>,
  opts: { lr?: number; epochs?: number } = {},
): NeuralODEParams {
  const lr = opts.lr ?? 0.001;
  const epochs = opts.epochs ?? 100;
  const params: NeuralODEParams = { weights: [0.1, 0.01], bias: 0 };

  for (let e = 0; e < epochs; e++) {
    const x0 = observations[0].x;
    const t0 = observations[0].t;
    let loss = 0;
    const grads = { w0: 0, w1: 0, b: 0 };

    for (let i = 1; i < observations.length; i++) {
      const { final } = integrateODE(x0, t0, observations[i].t, 5, params);
      const err = final - observations[i].x;
      loss += err * err;
      grads.w0 += err * observations[i].x;
      grads.w1 += err * observations[i].t;
      grads.b += err;
    }

    params.weights[0] -= (lr * grads.w0) / observations.length;
    params.weights[1] -= (lr * grads.w1) / observations.length;
    params.bias -= (lr * grads.b) / observations.length;
  }

  return params;
}