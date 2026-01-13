import Image from "next/image";
import Link from "next/link";
import { BlogArticle } from "@/types/blog";

interface TextCardProps {
  article: BlogArticle;
  showImage?: boolean;
  titleSize?: "base" | "lg";
}

export default function TextCard({ 
  article, 
  showImage = false,
  titleSize = "base"
}: TextCardProps) {
  return (
    <Link
      href={`/blog/${article.id}`}
      className="group block bg-white rounded-lg shadow-sm hover:shadow-md transition-all h-full overflow-hidden"
    >
      {/* Image (optional) */}
      {showImage && (
        <div className="relative h-[200px] overflow-hidden">
          <Image
            src={article.image}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      
      {/* Content */}
      <div className="p-4">
        <span className="text-xs font-semibold text-[#00b14f] uppercase tracking-wide">
          {article.category}
        </span>
        <h3 className={`font-bold text-gray-900 mt-1 mb-2 line-clamp-2 group-hover:text-[#00b14f] transition-colors ${
          titleSize === "lg" ? "text-lg" : "text-base"
        }`}>
          {article.title}
        </h3>
        <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
          <span>WorkHub</span>
          <span>•</span>
          <span>{article.date}</span>
        </div>
        <p className="text-gray-600 text-sm line-clamp-2">
          {article.excerpt}
        </p>
      </div>
    </Link>
  );
}
