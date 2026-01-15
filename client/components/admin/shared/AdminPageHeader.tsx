interface AdminPageHeaderProps {
  title: string;
  totalElements?: number;
  badge?: {
    count: number;
    label: string;
  };
}

export default function AdminPageHeader({ title, totalElements, badge }: AdminPageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <div className="flex items-center gap-2">
        {badge && badge.count > 0 && (
          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">
            {badge.count} {badge.label}
          </span>
        )}
        {totalElements !== undefined && (
          <span className="text-xs text-gray-500">Tổng: {totalElements}</span>
        )}
      </div>
    </div>
  );
}
