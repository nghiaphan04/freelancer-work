interface AuthFormErrorProps {
  error?: string;
  centered?: boolean;
}

export default function AuthFormError({ error, centered = false }: AuthFormErrorProps) {
  if (!error) return null;
  return <p className={`text-red-500 text-xs ${centered ? "text-center" : ""}`}>{error}</p>;
}
