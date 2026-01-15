interface AuthBackButtonProps {
  onClick: () => void;
  text: string;
  disabled?: boolean;
}

export default function AuthBackButton({ onClick, text, disabled = false }: AuthBackButtonProps) {
  return (
    <div className="flex justify-center mt-3">
      <button 
        type="button" 
        onClick={onClick} 
        disabled={disabled} 
        className="text-sm text-gray-500 hover:text-[#00b14f] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ← {text}
      </button>
    </div>
  );
}
