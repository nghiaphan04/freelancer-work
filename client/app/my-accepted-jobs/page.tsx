import ProtectedLayout from "@/components/layout/ProtectedLayout";
import AcceptedJobsList from "@/components/jobs/lists/accepted/AcceptedJobsList";

export default function MyAcceptedJobsPage() {
  return (
    <ProtectedLayout>
      <AcceptedJobsList />
    </ProtectedLayout>
  );
}
