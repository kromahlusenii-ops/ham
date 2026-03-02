import DocsContent from "@/components/DocsContent";
import DocsSidebar from "@/components/DocsSidebar";

export default function DashboardDocsPage() {
  return (
    <div className="-mx-6 -mt-8 sm:-mx-8">
      <div className="relative">
        <DocsSidebar />
        <div className="lg:ml-64">
          <DocsContent />
        </div>
      </div>
    </div>
  );
}
