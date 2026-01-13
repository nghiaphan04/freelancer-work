"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { Job, JOB_COMPLEXITY_CONFIG, WORK_TYPE_CONFIG, JOB_DURATION_CONFIG } from "@/types/job";
import Icon from "@/components/ui/Icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const BADGE_IMAGES = ["/1-sao.png", "/2-sao.png", "/3-sao.png"];

interface JobCardWithPreviewProps {
  job: Job;
  onFavorite?: (jobId: number) => void;
  isFavorite?: boolean;
}

export default function JobCardWithPreview({ job, onFavorite, isFavorite = false }: JobCardWithPreviewProps) {
  const badgeImage = useMemo(() => BADGE_IMAGES[job.id % BADGE_IMAGES.length], [job.id]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPosition, setPreviewPosition] = useState<"right" | "left">("right");
  const cardRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const formatBudget = (budget?: number) => {
    if (!budget) return "Thỏa thuận";
    if (budget >= 1000000) {
      return `${(budget / 1000000).toFixed(budget % 1000000 === 0 ? 0 : 1)} triệu`;
    }
    return new Intl.NumberFormat("vi-VN").format(budget);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "Đã hết hạn";
    if (diffDays === 0) return "Hôm nay";
    return `Còn ${diffDays} ngày`;
  };

  const workTypeConfig = WORK_TYPE_CONFIG[job.workType];
  const durationConfig = JOB_DURATION_CONFIG[job.duration];
  const complexityConfig = JOB_COMPLEXITY_CONFIG[job.complexity];

  useEffect(() => {
    if (showPreview && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const spaceOnRight = window.innerWidth - rect.right;
      setPreviewPosition(spaceOnRight < 420 ? "left" : "right");
    }
  }, [showPreview]);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setShowPreview(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShowPreview(false);
  };

  return (
    <div 
      ref={cardRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main Card */}
      <div className={`bg-white rounded-xl border p-4 transition-all duration-200 ${
        showPreview ? "border-[#00b14f] shadow-lg" : "border-gray-200 hover:shadow-lg hover:border-[#00b14f]/30"
      }`}>
        <div className="flex gap-3">
          {/* Company Logo */}
          <Link href={`/jobs/${job.id}`} className="shrink-0">
            <Avatar className="w-14 h-14 rounded-lg border border-gray-100">
              <AvatarImage 
                src={badgeImage} 
                alt={job.employer.company || job.employer.fullName} 
                className="object-cover"
              />
              <AvatarFallback className="rounded-lg bg-gradient-to-br from-[#00b14f] to-[#009643] text-white text-lg font-semibold">
                {(job.employer.company || job.employer.fullName)?.charAt(0)?.toUpperCase() || "C"}
              </AvatarFallback>
            </Avatar>
          </Link>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Badges */}
            {job.viewCount > 100 && (
              <div className="flex items-center gap-1.5 mb-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-orange-500 to-orange-400 text-white text-[10px] font-semibold rounded-full">
                  <Icon name="local_fire_department" size={12} />
                  TOP
                </span>
              </div>
            )}

            {/* Job Title */}
            <Link href={`/jobs/${job.id}`}>
              <h3 className={`font-semibold transition-colors line-clamp-2 mb-1 text-[15px] leading-snug ${
                showPreview ? "text-[#00b14f]" : "text-gray-900 hover:text-[#00b14f]"
              }`}>
                {job.title}
              </h3>
            </Link>

            {/* Company Name */}
            <p className="text-sm text-gray-500 truncate mb-2.5">
              {job.employer.company || job.employer.fullName}
            </p>

            {/* Tags */}
            <div className="flex items-center flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-1 bg-[#e8f5e9] text-[#00875a] text-xs font-medium rounded-md">
                {formatBudget(job.budget)}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                {job.employer.location || "Remote"}
              </span>
            </div>
          </div>

          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              onFavorite?.(job.id);
            }}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full hover:bg-transparent transition-colors self-start focus:outline-none focus:ring-0 outline-none ring-0 border-0"
          >
            <Icon 
              name={isFavorite ? "favorite" : "favorite_border"} 
              size={22} 
              className={isFavorite ? "text-red-500" : "text-gray-400 hover:text-red-400"} 
            />
          </button>
        </div>
      </div>

      {/* Preview Popup - Desktop Only */}
      {showPreview && (
        <div 
          className={`hidden lg:block absolute top-0 z-50 w-[400px] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200 ${
            previewPosition === "right" ? "left-full ml-3" : "right-full mr-3"
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex gap-3">
              <Avatar className="w-12 h-12 rounded-lg border border-gray-100 shrink-0">
                <AvatarImage src={badgeImage} alt={job.employer.company || job.employer.fullName} />
                <AvatarFallback className="rounded-lg bg-gradient-to-br from-[#00b14f] to-[#009643] text-white font-semibold">
                  {(job.employer.company || job.employer.fullName)?.charAt(0)?.toUpperCase() || "C"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 line-clamp-2 text-[15px] leading-snug">
                  {job.title}
                </h4>
                <p className="text-sm text-gray-500 truncate">{job.employer.company || job.employer.fullName}</p>
                <p className="text-[#00b14f] font-semibold text-sm mt-1">{formatBudget(job.budget)}</p>
              </div>
              <Icon name="verified" size={20} className="text-[#00b14f] shrink-0" />
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                <Icon name="location_on" size={14} />
                {job.employer.location || "Remote"}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                <Icon name="work" size={14} />
                {complexityConfig.label}
              </span>
              {job.applicationDeadline && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  <Icon name="schedule" size={14} />
                  {formatDate(job.applicationDeadline)}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div 
            className="p-4 border-b border-gray-100 max-h-[200px] overflow-y-auto scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <h5 className="font-semibold text-gray-800 mb-2 text-sm">Mô tả công việc</h5>
            <p className="text-sm text-gray-600 whitespace-pre-line line-clamp-6">
              {job.description || "Chưa có mô tả chi tiết."}
            </p>
            {job.requirements && (
              <>
                <h5 className="font-semibold text-gray-800 mb-2 mt-3 text-sm">Yêu cầu</h5>
                <p className="text-sm text-gray-600 whitespace-pre-line line-clamp-4">
                  {job.requirements}
                </p>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 flex gap-3">
            <button className="flex-1 px-4 py-2.5 border-2 border-[#00b14f] text-[#00b14f] font-semibold rounded-lg hover:bg-[#00b14f]/5 transition-colors">
              Ứng tuyển
            </button>
            <Link 
              href={`/jobs/${job.id}`}
              className="flex-1 px-4 py-2.5 bg-[#00b14f] text-white font-semibold rounded-lg hover:bg-[#009643] transition-colors text-center"
            >
              Xem chi tiết
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
