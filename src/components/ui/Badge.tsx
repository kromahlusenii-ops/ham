type BadgeProps = {
  children: React.ReactNode;
  variant?: "default" | "accent";
  className?: string;
};

export default function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[11px] tracking-wide ${
        variant === "accent"
          ? "bg-accent-light text-accent"
          : "bg-silk text-gray"
      } ${className}`}
    >
      {children}
    </span>
  );
}
