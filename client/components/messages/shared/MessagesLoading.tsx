import { Skeleton } from "@/components/ui/skeleton";

interface MessagesLoadingProps {
  type?: "conversations" | "messages" | "search";
  count?: number;
}

export default function MessagesLoading({ 
  type = "conversations", 
  count = 6 
}: MessagesLoadingProps) {
  if (type === "messages") {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className={`flex ${idx % 2 === 0 ? "justify-start" : "justify-end"}`}>
            <Skeleton className={`h-12 rounded-3xl ${idx % 2 === 0 ? "w-48" : "w-56"}`} />
          </div>
        ))}
      </div>
    );
  }

  if (type === "search") {
    return (
      <div className="space-y-1 p-2">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="flex items-center gap-3 px-2 py-2">
            <Skeleton className="w-12 h-12 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="flex items-center gap-3 p-3">
          <Skeleton className="w-14 h-14 md:w-12 md:h-12 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
