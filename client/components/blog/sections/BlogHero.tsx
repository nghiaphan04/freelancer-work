"use client";

import Image from "next/image";

export default function BlogHero() {
  return (
    <div className="relative h-[280px] md:h-[350px] overflow-hidden">
      <Image
        src="/landing/banner.png"
        alt="Blog Banner"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Cẩm nang nghề nghiệp
          </h1>
          <p className="text-gray-200 text-lg max-w-2xl mx-auto">
            Khám phá bí kíp tìm việc, định hướng nghề nghiệp và kiến thức chuyên ngành
          </p>
        </div>
      </div>
    </div>
  );
}
