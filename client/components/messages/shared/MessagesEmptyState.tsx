import Icon from "@/components/ui/Icon";

interface MessagesEmptyStateProps {
  icon?: string;
  title?: string;
  message: string;
  children?: React.ReactNode;
}

export default function MessagesEmptyState({ 
  icon = "forum", 
  title,
  message, 
  children 
}: MessagesEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-gray-500 p-4">
      <Icon name={icon} size={48} className="text-gray-300 mb-2" />
      {title && <p className="text-sm font-medium mb-1">{title}</p>}
      <p className="text-sm">{message}</p>
      {children}
    </div>
  );
}
