import Link from "next/link";
import { FolderGit2 } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-stone bg-white p-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-silk">
        <FolderGit2 className="h-6 w-6 text-gray" />
      </div>
      <h3 className="mt-4 text-sm font-medium text-ink">
        Connect your first repository
      </h3>
      <p className="mt-1 text-sm text-gray">
        Link a GitHub repo to start tracking agent memory usage.
      </p>
      <Link
        href="/dashboard/repos"
        className="mt-4 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-charcoal"
      >
        Browse Repositories
      </Link>
    </div>
  );
}
