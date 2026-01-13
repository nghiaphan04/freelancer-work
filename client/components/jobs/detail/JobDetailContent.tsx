"use client";

import { Job } from "@/types/job";

interface JobDetailContentProps {
  job: Job;
}

export default function JobDetailContent({ job }: JobDetailContentProps) {
  return (
    <>
      {/* Description */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Mô tả công việc</h2>
        <div className="prose prose-gray max-w-none">
          <p className="whitespace-pre-wrap text-gray-700">{job.description}</p>
        </div>
      </div>

      {/* Context */}
      {job.context && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bối cảnh dự án</h2>
          <p className="whitespace-pre-wrap text-gray-700">{job.context}</p>
        </div>
      )}

      {/* Requirements */}
      {job.requirements && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Yêu cầu</h2>
          <p className="whitespace-pre-wrap text-gray-700">{job.requirements}</p>
        </div>
      )}

      {/* Deliverables */}
      {job.deliverables && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sản phẩm bàn giao</h2>
          <p className="whitespace-pre-wrap text-gray-700">{job.deliverables}</p>
        </div>
      )}

      {/* Skills */}
      {job.skills && job.skills.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Kỹ năng yêu cầu</h2>
          <div className="flex flex-wrap gap-2">
            {job.skills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
