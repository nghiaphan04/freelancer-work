interface JobsPageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function JobsPageHeader({ title, subtitle, children }: JobsPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
