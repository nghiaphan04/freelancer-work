import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Job, PostedJobsStats } from "@/types/job";

export function usePostedJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<PostedJobsStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async (status?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getPostedJobs(status === "all" ? undefined : status);
      if (response.status === "SUCCESS" && response.data) {
        setJobs(response.data);
      } else {
        setError(response.message || "Không thể tải danh sách công việc");
      }
    } catch {
      setError("Không thể tải danh sách công việc");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.getPostedJobsStats();
      if (response.status === "SUCCESS" && response.data) {
        setStats(response.data);
      }
    } catch {
    }
  }, []);

  return { jobs, stats, isLoading, error, fetchJobs, fetchStats };
}
