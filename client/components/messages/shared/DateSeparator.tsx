import { formatDateSeparator } from "@/lib/format";

interface DateSeparatorProps {
  date: string;
}

export default function DateSeparator({ date }: DateSeparatorProps) {
  return (
    <div className="flex items-center justify-center my-4">
      <span className="text-xs text-gray-400">{formatDateSeparator(date)}</span>
    </div>
  );
}
