import { useState, useCallback } from "react";
import { Job, JobStatus } from "@/types/job";
import { api } from "@/lib/api";

interface AcceptedJobsStats {
  inProgress: number;
  completed: number;
  disputed: number;
  totalEarnings: number;
}

export function useAcceptedJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<AcceptedJobsStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async (status?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const params: { status?: JobStatus; size?: number } = { size: 100 };
      if (status && status !== "all") {
        params.status = status as JobStatus;
      }
      const res = await api.getMyWorkingJobs(params);
      if (res.status === "SUCCESS" && res.data) {
        setJobs(res.data.content);
      } else {
        setError(res.message || "Không thể tải danh sách công việc");
        setJobs([]);
      }
    } catch {
      setError("Không thể tải danh sách công việc");
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.getMyWorkingJobsStats();
      if (res.status === "SUCCESS" && res.data) {
        setStats(res.data);
      }
    } catch {
      // Silent fail for stats
    }
  }, []);

  return { jobs, stats, isLoading, error, fetchJobs, fetchStats };
}
