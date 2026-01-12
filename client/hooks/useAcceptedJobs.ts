import { useState, useCallback } from "react";
import { Job } from "@/types/job";

interface AcceptedJobsStats {
  inProgress: number;
  pendingReview: number;
  completed: number;
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
      setJobs([]);
    } catch {
      setError("Không thể tải danh sách công việc");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      setStats(null);
    } catch {
    }
  }, []);

  return { jobs, stats, isLoading, error, fetchJobs, fetchStats };
}
