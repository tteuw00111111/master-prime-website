
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import AnimatedSection from "@/components/AnimatedSection";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import About from "@/components/About";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";

const LoadingScreen = () => (
  <div className="fixed inset-0 bg-black flex flex-col items-center z-50 px-4">
    <div className="flex items-center justify-center pt-12 sm:pt-16 mb-8">
      <Image
        src="/master_prime_logo.png"
        alt="Master Prime Logo"
        width={160}
        height={53}
        className="h-10 sm:h-14 w-auto"
      />
    </div>
    <div className="flex-1 flex flex-col items-center justify-center gap-6 max-w-sm w-full">
      <div className="relative">
        <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-400 rounded-full"></div>
        </div>
      </div>
      <div className="text-center space-y-2">
        <div className="text-yellow-400 font-bold text-lg sm:text-xl">
          Carregando...
        </div>
        <p className="text-white text-sm sm:text-base leading-relaxed">
          Aguarde, estamos redirecionando você para o site
        </p>
      </div>
    </div>
  </div>
);

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <main>
      <Header />
      <Hero />
      {/* <AnimatedSection>
        <Services />
      </AnimatedSection> */}
      <AnimatedSection>
        <About />
      </AnimatedSection>
      <AnimatedSection>
        <Contact />
      </AnimatedSection>
      <Footer />
      <>
        <WhatsAppFloat />
      </>
    </main>
  );
}

