"use client";

import Link from "next/link";
import { Job, JOB_COMPLEXITY_CONFIG, WORK_TYPE_CONFIG } from "@/types/job";
import Icon from "@/components/ui/Icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMemo } from "react";

const BADGE_IMAGES = ["/1-sao.png", "/2-sao.png", "/3-sao.png"];

interface JobCardProps {
  job: Job;
  onFavorite?: (jobId: number) => void;
  isFavorite?: boolean;
}

export default function JobCard({ job, onFavorite, isFavorite = false }: JobCardProps) {
  const badgeImage = useMemo(() => BADGE_IMAGES[job.id % BADGE_IMAGES.length], [job.id]);
  const formatBudget = (budget?: number) => {
    if (!budget) return "Thỏa thuận";
    if (budget >= 1000000) {
      return `${(budget / 1000000).toFixed(budget % 1000000 === 0 ? 0 : 1)} triệu`;
    }
    return new Intl.NumberFormat("vi-VN").format(budget);
  };

  const complexityConfig = JOB_COMPLEXITY_CONFIG[job.complexity];
  const workTypeConfig = WORK_TYPE_CONFIG[job.workType];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:border-[#00b14f]/30 transition-all duration-200 group">
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
            <h3 className="font-semibold text-gray-900 group-hover:text-[#00b14f] transition-colors line-clamp-2 mb-1 text-[15px] leading-snug">
              {job.title}
            </h3>
          </Link>

          {/* Company Name */}
          <p className="text-sm text-gray-500 truncate mb-2.5">
            {job.employer.company || job.employer.fullName}
          </p>

          {/* Tags */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Budget/Salary */}
            <span className="inline-flex items-center px-2.5 py-1 bg-[#e8f5e9] text-[#00875a] text-xs font-medium rounded-md">
              {formatBudget(job.budget)}
            </span>

            {/* Location */}
            <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
              {job.employer.location || "Remote"}
            </span>

            {/* Work Type - show only on larger screens */}
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
              {workTypeConfig.label}
            </span>
          </div>
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            onFavorite?.(job.id);
          }}
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors self-start"
        >
          <Icon 
            name={isFavorite ? "favorite" : "favorite_border"} 
            size={22} 
            className={isFavorite ? "text-red-500" : "text-gray-400 hover:text-red-400"} 
          />
        </button>
      </div>
    </div>
  );
}
