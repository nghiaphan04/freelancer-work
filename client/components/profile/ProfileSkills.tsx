"use client";

import Icon from "@/components/ui/Icon";

interface ProfileSkillsProps {
  skills?: string[];
}

export default function ProfileSkills({ skills }: ProfileSkillsProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Kỹ năng</h2>
        <div className="flex gap-2">
          <button className="text-gray-500 hover:text-gray-700">
            <Icon name="add" size={18} />
          </button>
          <button className="text-gray-500 hover:text-gray-700">
            <Icon name="edit" size={18} />
          </button>
        </div>
      </div>
      {skills && skills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span key={skill} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
              {skill}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 italic">Chưa có kỹ năng nào</p>
      )}
    </div>
  );
}
