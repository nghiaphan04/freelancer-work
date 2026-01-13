import Image from "next/image";
import Link from "next/link";

export default function BlogBanner() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link href="/mbti" className="block relative h-[200px] md:h-[250px] rounded-lg overflow-hidden group">
        {/* Background Image */}
        <Image
          src="/landing/slide2.png"
          alt="Trắc nghiệm MBTI"
          fill
          className="object-cover"
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/70" />
        
        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-center items-start px-8 md:px-12">
          <p className="text-white/80 text-sm mb-1">MBTI by WorkHub</p>
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
            TRẮC NGHIỆM<br />TÍNH CÁCH MBTI
          </h2>
          <span className="px-6 py-3 bg-[#00b14f] text-white rounded-lg hover:bg-[#009643] transition-colors font-medium">
            Làm trắc nghiệm ngay
          </span>
        </div>
      </Link>
    </div>
  );
}
