"use client";

import Image from "next/image";
import { partners } from "@/constant/landing";

export default function Partners() {
  const duplicatedPartners = [...partners, ...partners];

  return (
    <section className="py-10 bg-gray-50 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <h2 className="text-xl font-bold text-[#00b14f] text-center">
          Đối tác của chúng tôi
        </h2>
        <p className="text-gray-600 text-sm text-center mt-2">
          Được tin tưởng bởi các doanh nghiệp hàng đầu Việt Nam
        </p>
      </div>

      {/* Infinite scroll slider */}
      <div className="relative">
        <div className="flex animate-scroll">
          {duplicatedPartners.map((partner, index) => (
            <div
              key={`${partner.id}-${index}`}
              className="flex-shrink-0 w-[150px] mx-6 flex items-center justify-center"
            >
              <Image
                src={partner.logo}
                alt={partner.name}
                width={120}
                height={48}
                className="object-contain max-h-12 grayscale hover:grayscale-0 transition-all"
              />
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 20s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
