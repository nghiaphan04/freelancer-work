import Icon from "@/components/ui/Icon";

interface JobsErrorProps {
  message: string;
  onRetry?: () => void;
}

export default function JobsError({ message, onRetry }: JobsErrorProps) {
  return (
    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
      <Icon name="error_outline" size={48} className="text-red-400 mx-auto mb-4" />
      <p className="text-gray-600 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-[#00b14f] text-white rounded-lg hover:bg-[#009643] transition-colors"
        >
          Thử lại
        </button>
      )}
    </div>
  );
}
