import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import Products from "@/components/landing/Products";
import AppDownload from "@/components/landing/AppDownload";

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1">
        <Hero />
        <Products />
        <AppDownload />
        <Features />
      </main>

      <Footer />
    </div>
  );
}
