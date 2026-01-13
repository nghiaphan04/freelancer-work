import Icon from "@/components/ui/Icon";

interface AuthFormHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  centered?: boolean;
}

export default function AuthFormHeader({ title, subtitle, icon, centered = false }: AuthFormHeaderProps) {
  return (
    <div className={`mb-4 lg:mb-3 ${centered ? "text-center" : ""}`}>
      {icon && <Icon name={icon} size={48} className="text-[#00b14f] mx-auto mb-3" />}
      <h1 className="text-lg sm:text-xl font-bold text-[#00b14f] mb-1">{title}</h1>
      {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
    </div>
  );
}
