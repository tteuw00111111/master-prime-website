"use client";

import Image from "next/image";
import AnimatedWave from "./AnimatedWave";
import { fireAdsConversion } from "@/lib/ads";

const SERVICES = [
  {
    imgSrc: "/random_1.png",
    alt: "",
  },
  {
    imgSrc: "/random_2.png",
    alt: "",
  },
  {
    imgSrc: "/random_3.png",
    alt: "",
  },
  {
    imgSrc: "/random_4.png",
    alt: "",
  },
  {
    imgSrc: "/random_5.png",
    alt: "",
  },
];

// Conversion ID for WhatsApp clicks
const SEND_TO = "AW-17383658790/XfceCMeR4KQbEKaqluFA";

export default function Services() {
  const handleWhatsAppClick = () => {
    fireAdsConversion(SEND_TO);
  };
  return (
    <section
      id="services"
      className="relative bg-[#E2E2E2] font-roboto min-h-screen md:flex md:items-center md:justify-center overflow-hidden"
    >
      <AnimatedWave />

      <div className="w-full mx-auto px-0 md:px-8 relative z-10">
        <div className="flex flex-col min-h-screen md:min-h-0 md:flex-row justify-center items-center gap-0 md:gap-12 px-0 md:px-16 max-w-none mx-auto overflow-x-auto">
          {SERVICES.map((service, index) => (
            <a
              key={index}
              href="https://wa.me/message/TMEA4ZXLGX6WN1"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWhatsAppClick}
              className="group relative flex items-center justify-center flex-shrink-0 bg-white/80 backdrop-blur-md shadow-lg transition-all duration-700 ease-out hover:scale-[1.02] hover:shadow-2xl hover:shadow-yellow-400/30 cursor-pointer overflow-hidden w-full h-[45vh] md:w-[32rem] md:h-[32rem] lg:w-[40rem] lg:h-[40rem] rounded-none md:rounded-2xl"
            >
              <Image
                src={service.imgSrc}
                alt={service.alt}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 512px, 640px"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 rounded-none md:rounded-2xl"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
