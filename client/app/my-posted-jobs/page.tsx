import ProtectedLayout from "@/components/layout/ProtectedLayout";
import PostedJobsList from "@/components/jobs/lists/posted/PostedJobsList";

export default function MyPostedJobsPage() {
  return (
    <ProtectedLayout>
      <PostedJobsList />
    </ProtectedLayout>
  );
}
