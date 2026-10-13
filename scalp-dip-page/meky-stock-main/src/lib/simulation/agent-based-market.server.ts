/**
 * Agent-Based Market Simulation: noise traders, momentum traders, value traders.
 */

export type AgentType = "noise" | "momentum" | "value" | "contrarian";

export interface MarketAgent {
  type: AgentType;
  capital: number;
  position: number;
  aggressiveness: number;
}

function decide(agent: MarketAgent, price: number, history: number[], fundamentalValue: number): number {
  // Returns desired order size (positive = buy, negative = sell)
  switch (agent.type) {
    case "noise":
      return (Math.random() - 0.5) * agent.aggressiveness;
    case "momentum": {
      if (history.length < 5) return 0;
      const recent = history.slice(-5);
      const trend = (recent[recent.length - 1] - recent[0]) / recent[0];
      return Math.sign(trend) * Math.min(Math.abs(trend) * 10, 1) * agent.aggressiveness;
    }
    case "value": {
      const mispricing = (fundamentalValue - price) / price;
      return Math.sign(mispricing) * Math.min(Math.abs(mispricing) * 5, 1) * agent.aggressiveness;
    }
    case "contrarian": {
      if (history.length < 5) return 0;
      const recent = history.slice(-5);
      const trend = (recent[recent.length - 1] - recent[0]) / recent[0];
      return -Math.sign(trend) * Math.min(Math.abs(trend) * 5, 1) * agent.aggressiveness;
    }
  }
}

export function simulateAgentMarket(
  initialPrice: number,
  fundamentalValue: number,
  agents: MarketAgent[],
  steps: number,
): { prices: number[]; volumes: number[] } {
  const prices: number[] = [initialPrice];
  const volumes: number[] = [];
  let price = initialPrice;

  for (let t = 0; t < steps; t++) {
    let netDemand = 0;
    let volume = 0;
    for (const agent of agents) {
      const order = decide(agent, price, prices, fundamentalValue);
      netDemand += order;
      volume += Math.abs(order);
    }
    // Price impact (simple linear)
    const impact = netDemand / agents.length;
    price = Math.max(price * (1 + impact * 0.01), 0.01);
    prices.push(price);
    volumes.push(volume);
  }

  return { prices, volumes };
}

export function createDiverseAgents(count: number = 100): MarketAgent[] {
  const agents: MarketAgent[] = [];
  const types: AgentType[] = ["noise", "momentum", "value", "contrarian"];
  for (let i = 0; i < count; i++) {
    agents.push({
      type: types[i % types.length],
      capital: 10000 + Math.random() * 90000,
      position: 0,
      aggressiveness: 0.3 + Math.random() * 0.7,
    });
  }
  return agents;
}