import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";
import Sustainability from "@/components/Sustainability";

import Footer from "@/components/Footer";

export const revalidate = 3600; // ISR — revalidate every hour

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <Features />
        <Pricing />
        <Sustainability />

      </main>
      <Footer />
    </>
  );
}
