type CodeBlockProps = {
  children: string;
  title?: string;
  className?: string;
};

export default function CodeBlock({
  children,
  title,
  className = "",
}: CodeBlockProps) {
  return (
    <div className={`overflow-hidden rounded-lg border border-stone bg-snow ${className}`}>
      {title && (
        <div className="border-b border-stone px-4 py-2">
          <span className="font-mono text-[11px] text-ash">{title}</span>
        </div>
      )}
      <div className="p-4">
        <pre className="overflow-x-auto font-mono text-[13px] leading-[1.8] text-carbon">
          {children}
        </pre>
      </div>
    </div>
  );
}
