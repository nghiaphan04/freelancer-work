import ProtectedLayout from "@/components/layout/ProtectedLayout";
import AcceptedJobsList from "@/components/jobs/AcceptedJobsList";

export default function MyAcceptedJobsPage() {
  return (
    <ProtectedLayout>
      <AcceptedJobsList />
    </ProtectedLayout>
  );
}
