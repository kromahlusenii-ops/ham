import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DocsContent from "@/components/DocsContent";
import DocsSidebar from "@/components/DocsSidebar";

export const revalidate = 3600; // ISR — revalidate every hour

export default function DocsPage() {
  return (
    <>
      <Header />
      <div className="pt-16">
        <DocsSidebar />
        <main className="lg:ml-64">
          <DocsContent />
          <Footer />
        </main>
      </div>
    </>
  );
}
