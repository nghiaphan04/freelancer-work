"use client";

import Link from "next/link";
import { popularKeywords } from "@/constant/landing";

export default function PopularKeywords() {
  return (
    <section className="py-12 bg-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-sm leading-7 text-justify">
          {popularKeywords.map((keyword, index) => (
            <span key={index}>
              <Link
                href={`/search?q=${encodeURIComponent(keyword)}`}
                className="text-[#334155] hover:text-[#00b14f] hover:underline transition-colors"
              >
                {keyword}
              </Link>
              {index < popularKeywords.length - 1 && <span className="text-gray-400">,&nbsp;&nbsp;</span>}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
