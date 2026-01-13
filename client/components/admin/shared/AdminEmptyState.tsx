interface AdminEmptyStateProps {
  message: string;
}

export default function AdminEmptyState({ message }: AdminEmptyStateProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500 text-sm">
      {message}
    </div>
  );
}
