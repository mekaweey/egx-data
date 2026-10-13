/**
 * GitHub activity proxy (for tech companies): development velocity.
 */

export interface RepoActivity {
  repoName: string;
  commitsLast30d: number;
  starsGained: number;
  contributors: number;
  openIssues: number;
  closedIssues: number;
  releases: number;
}

export interface GitHubSignal {
  velocityScore: number;
  momentum: "accelerating" | "steady" | "slowing";
  healthScore: number;
  signal: "very_active" | "active" | "stagnant";
}

export function analyzeGitHub(
  current: RepoActivity,
  baseline: RepoActivity,
): GitHubSignal {
  const commitGrowth = baseline.commitsLast30d === 0 ? 0 : (current.commitsLast30d - baseline.commitsLast30d) / baseline.commitsLast30d;
  const starGrowth = baseline.starsGained === 0 ? 0 : (current.starsGained - baseline.starsGained) / baseline.starsGained;
  const issueRatio = current.openIssues / Math.max(current.openIssues + current.closedIssues, 1);

  const velocityScore = Math.min(
    1,
    (current.commitsLast30d / 100) * 0.4 +
      (current.contributors / 50) * 0.3 +
      (current.releases / 5) * 0.3,
  );

  let momentum: GitHubSignal["momentum"] = "steady";
  if (commitGrowth > 0.2 || starGrowth > 0.3) momentum = "accelerating";
  else if (commitGrowth < -0.2) momentum = "slowing";

  const healthScore = Math.max(0, 1 - issueRatio) * 0.5 + velocityScore * 0.5;

  let signal: GitHubSignal["signal"] = "active";
  if (velocityScore > 0.7 && momentum !== "slowing") signal = "very_active";
  else if (velocityScore < 0.2) signal = "stagnant";

  return { velocityScore, momentum, healthScore, signal };
}