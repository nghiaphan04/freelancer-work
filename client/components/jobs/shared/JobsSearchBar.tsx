import Icon from "@/components/ui/Icon";

interface JobsSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function JobsSearchBar({ 
  value, 
  onChange, 
  placeholder = "Tìm kiếm..." 
}: JobsSearchBarProps) {
  return (
    <div className="relative">
      <Icon name="search" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00b14f] focus:ring-2 focus:ring-[#00b14f]/20 transition-all bg-white"
      />
    </div>
  );
}
