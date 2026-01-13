import Image from "next/image";
import Link from "next/link";
import { BlogArticle } from "@/types/blog";

interface KnowledgeCardProps {
  article: BlogArticle;
}

export default function KnowledgeCard({ article }: KnowledgeCardProps) {
  return (
    <Link
      href={`/blog/${article.id}`}
      className="group block"
    >
      {/* Image */}
      <div className="relative h-[160px] rounded-lg overflow-hidden mb-3">
        <Image
          src={article.image}
          alt={article.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      
      {/* Content */}
      <div>
        <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">
          {article.category}
        </span>
        <h3 className="text-base font-bold text-white mt-1 mb-2 line-clamp-2 group-hover:text-white/90">
          {article.title}
        </h3>
        <div className="flex items-center gap-2 text-white/70 text-xs mb-2">
          <span>WorkHub</span>
          <span>•</span>
          <span>{article.date}</span>
        </div>
        <p className="text-white/70 text-sm line-clamp-2">
          {article.excerpt}
        </p>
      </div>
    </Link>
  );
}
