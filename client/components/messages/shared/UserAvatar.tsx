import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import WalletAvatar from "@/components/ui/WalletAvatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string;
  name: string;
  walletAddress?: string;
  online?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  showOnlineStatus?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-7 h-7",
  md: "w-10 h-10",
  lg: "w-12 h-12",
  xl: "w-14 h-14 md:w-12 md:h-12",
};

const sizePx = {
  sm: 28,
  md: 40,
  lg: 48,
  xl: 56,
};

const textSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg md:text-base",
};

const onlineDotClasses = {
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3 h-3",
  xl: "w-3.5 h-3.5 md:w-3 md:h-3",
};

export default function UserAvatar({ 
  src, 
  name, 
  walletAddress,
  online = false,
  size = "md",
  showOnlineStatus = false,
  className,
}: UserAvatarProps) {
  const renderAvatar = () => {
    if (src) {
      return (
        <Avatar className={sizeClasses[size]}>
          <AvatarImage src={src} />
          <AvatarFallback className={cn("bg-gray-200 text-gray-600", textSizeClasses[size])}>
            {name.charAt(0)}
          </AvatarFallback>
        </Avatar>
      );
    }
    
    if (walletAddress) {
      return <WalletAvatar address={walletAddress} size={sizePx[size]} />;
    }
    
    return (
      <Avatar className={sizeClasses[size]}>
        <AvatarFallback className={cn("bg-gray-200 text-gray-600", textSizeClasses[size])}>
          {name.charAt(0)}
        </AvatarFallback>
      </Avatar>
    );
  };

  return (
    <div className={cn("relative shrink-0", className)}>
      {renderAvatar()}
      {showOnlineStatus && online && (
        <span className={cn(
          "absolute bottom-0 right-0 bg-green-500 border-2 border-white rounded-full",
          onlineDotClasses[size]
        )} />
      )}
    </div>
  );
}
