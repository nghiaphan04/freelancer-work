import Icon from "@/components/ui/Icon";

interface JobsEmptyStateProps {
  icon?: string;
  title?: string;
  message: string;
  children?: React.ReactNode;
}

export default function JobsEmptyState({ 
  icon = "work_off", 
  title,
  message, 
  children 
}: JobsEmptyStateProps) {
  return (
    <div className="bg-white rounded-lg shadow p-8 text-center">
      <Icon name={icon} size={48} className="text-gray-300 mx-auto mb-4" />
      {title && <h3 className="text-lg font-medium text-gray-700 mb-2">{title}</h3>}
      <p className="text-gray-500">{message}</p>
      {children}
    </div>
  );
}
