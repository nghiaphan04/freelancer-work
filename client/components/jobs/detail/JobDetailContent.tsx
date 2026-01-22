"use client";

import { Job } from "@/types/job";

interface JobDetailContentProps {
  job: Job;
}

export default function JobDetailContent({ job }: JobDetailContentProps) {
  let sectionNumber = 0;
  
  return (
    <div className="bg-white rounded-lg shadow">
      {/* Document Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 uppercase">Thông tin chi tiết công việc</h2>
      </div>
      
      {/* Document Body */}
      <div className="px-6 py-5 space-y-6">
        {/* Section 1: Description */}
        <section>
          <h3 className="text-sm font-bold text-gray-800 mb-2">
            {++sectionNumber}. Mô tả công việc
          </h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed pl-4">
            {job.description}
          </p>
        </section>

        {/* Section 2: Context */}
        {job.context && (
          <section>
            <h3 className="text-sm font-bold text-gray-800 mb-2">
              {++sectionNumber}. Bối cảnh dự án
            </h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed pl-4">
              {job.context}
            </p>
          </section>
        )}

        {/* Section 3: Requirements */}
        {job.requirements && (
          <section>
            <h3 className="text-sm font-bold text-gray-800 mb-2">
              {++sectionNumber}. Yêu cầu
            </h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed pl-4">
              {job.requirements}
            </p>
          </section>
        )}

        {/* Section 4: Deliverables */}
        {job.deliverables && (
          <section>
            <h3 className="text-sm font-bold text-gray-800 mb-2">
              {++sectionNumber}. Sản phẩm bàn giao
            </h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed pl-4">
              {job.deliverables}
            </p>
          </section>
        )}

        {/* Section 5: Skills */}
        {job.skills && job.skills.length > 0 && (
          <section>
            <h3 className="text-sm font-bold text-gray-800 mb-2">
              {++sectionNumber}. Kỹ năng yêu cầu
            </h3>
            <div className="pl-4 flex flex-wrap gap-2">
              {job.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
