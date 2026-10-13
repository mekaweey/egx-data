/**
 * Detects look-ahead, survivorship, and data-snooping bias.
 */
export interface BiasReport {
  lookAhead: { detected: boolean; details: string[] };
  survivorship: { detected: boolean; details: string[] };
  dataSnooping: { detected: boolean; details: string[] };
}

export interface BacktestRecord {
  signalTimestamp: string;
  decisionTimestamp: string;
  featureTimestamps: string[];
  symbol: string;
  symbolStillListed?: boolean;
}

export function detectBiases(records: BacktestRecord[], totalStrategiesTried = 1): BiasReport {
  const lookAheadIssues: string[] = [];
  const survivorIssues: string[] = [];
  const snoopingIssues: string[] = [];

  for (const r of records) {
    const decT = new Date(r.decisionTimestamp).getTime();
    for (const ft of r.featureTimestamps) {
      if (new Date(ft).getTime() > decT) {
        lookAheadIssues.push(`${r.symbol}: feature ${ft} after decision ${r.decisionTimestamp}`);
        break;
      }
    }
  }
  const totalSymbols = new Set(records.map((r) => r.symbol)).size;
  const stillListed = new Set(records.filter((r) => r.symbolStillListed).map((r) => r.symbol)).size;
  if (totalSymbols > 0 && stillListed / totalSymbols > 0.97 && totalSymbols > 20) {
    survivorIssues.push("Universe is >97% currently-listed — likely missing delisted symbols");
  }
  if (totalStrategiesTried > 50) {
    snoopingIssues.push(`Tested ${totalStrategiesTried} variants — apply Bonferroni / deflated Sharpe`);
  }

  return {
    lookAhead: { detected: lookAheadIssues.length > 0, details: lookAheadIssues.slice(0, 10) },
    survivorship: { detected: survivorIssues.length > 0, details: survivorIssues },
    dataSnooping: { detected: snoopingIssues.length > 0, details: snoopingIssues },
  };
}