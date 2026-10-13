import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type CronJob = {
  jobid: number;
  jobname: string;
  schedule: string;
  active: boolean;
  command: string;
};

export type CronRun = {
  runid: number;
  jobid: number;
  jobname: string | null;
  status: string;
  return_message: string | null;
  start_time: string;
  end_time: string | null;
};

export type AutomationSnapshot = {
  jobs: CronJob[];
  runs: CronRun[];
  stats: {
    total_jobs: number;
    active_jobs: number;
    runs_24h: number;
    failed_24h: number;
    last_run_at: string | null;
  };
};

export const getAutomationSnapshot = createServerFn({ method: "GET" }).handler(
  async (): Promise<AutomationSnapshot> => {
    const [jobsRes, runsRes] = await Promise.all([
      supabaseAdmin.rpc("get_cron_jobs"),
      supabaseAdmin.rpc("get_cron_runs", { p_limit: 100 }),
    ]);
    if (jobsRes.error) throw new Error(jobsRes.error.message);
    if (runsRes.error) throw new Error(runsRes.error.message);

    const jobs = (jobsRes.data ?? []) as CronJob[];
    const runs = (runsRes.data ?? []) as CronRun[];
    const dayAgo = Date.now() - 24 * 3600 * 1000;
    const runs24 = runs.filter((r) => new Date(r.start_time).getTime() >= dayAgo);
    const failed24 = runs24.filter((r) => r.status !== "succeeded");
    return {
      jobs,
      runs,
      stats: {
        total_jobs: jobs.length,
        active_jobs: jobs.filter((j) => j.active).length,
        runs_24h: runs24.length,
        failed_24h: failed24.length,
        last_run_at: runs[0]?.start_time ?? null,
      },
    };
  },
);