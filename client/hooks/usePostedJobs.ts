import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Job, JobStatus, Page } from "@/types/job";

export function usePostedJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [page, setPage] = useState<Page<Job> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async (params?: { 
    status?: JobStatus; 
    page?: number; 
    size?: number;
    sortBy?: string;
    sortDir?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getMyJobs(params);
      if (response.status === "SUCCESS" && response.data) {
        setJobs(response.data.content);
        setPage(response.data);
      } else {
        setError(response.message || "Không thể tải danh sách công việc");
      }
    } catch {
      setError("Không thể tải danh sách công việc");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { jobs, page, isLoading, error, fetchJobs };
}
