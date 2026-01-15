interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

export default function Icon({ name, size = 24, className = "" }: IconProps) {
  return (
    <span
      className={`material-icons leading-none align-middle ${className}`}
      style={{ fontSize: size }}
    >
      {name}
    </span>
  );
}

