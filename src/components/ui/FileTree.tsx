type FileTreeProps = {
  content: string;
  className?: string;
};

export default function FileTree({ content, className = "" }: FileTreeProps) {
  return (
    <div className={`rounded-lg border border-stone bg-snow p-4 ${className}`}>
      <pre className="overflow-x-auto font-mono text-[13px] leading-[1.8] text-carbon">
        {content}
      </pre>
    </div>
  );
}
