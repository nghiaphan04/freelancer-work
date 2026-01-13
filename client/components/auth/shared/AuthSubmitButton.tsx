import { Button } from "@/components/ui/button";

interface AuthSubmitButtonProps {
  isLoading: boolean;
  loadingText: string;
  text: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "submit" | "button";
}

export default function AuthSubmitButton({ 
  isLoading, 
  loadingText, 
  text, 
  disabled = false,
  onClick,
  type = "submit"
}: AuthSubmitButtonProps) {
  return (
    <Button 
      type={type}
      onClick={onClick}
      disabled={isLoading || disabled} 
      className="w-full h-10 lg:h-11 bg-[#00b14f] text-sm font-semibold"
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          {loadingText}
        </div>
      ) : (
        text
      )}
    </Button>
  );
}
