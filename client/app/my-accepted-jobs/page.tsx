import ProtectedLayout from "@/components/layout/ProtectedLayout";
import AcceptedJobsList from "@/components/jobs/lists/AcceptedJobsList";

export default function MyAcceptedJobsPage() {
  return (
    <ProtectedLayout>
      <AcceptedJobsList />
    </ProtectedLayout>
  );
}
