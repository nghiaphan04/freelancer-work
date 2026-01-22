"use client";

import Icon from "@/components/ui/Icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SkillsSectionProps {
  skills: string[];
  skillInput: string;
  onSkillInputChange: (value: string) => void;
  onAddSkill: () => void;
  onRemoveSkill: (skill: string) => void;
  disabled?: boolean;
}

export default function SkillsSection({
  skills,
  skillInput,
  onSkillInputChange,
  onAddSkill,
  onRemoveSkill,
  disabled,
}: SkillsSectionProps) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${disabled ? "opacity-60" : ""}`}>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Kỹ năng yêu cầu</h2>

      <div className="flex gap-2 mb-3">
        <Input
          value={skillInput}
          onChange={(e) => onSkillInputChange(e.target.value)}
          placeholder="Nhập kỹ năng..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAddSkill();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={onAddSkill}>
          Thêm
        </Button>
      </div>

      {skills && skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 px-3 py-1 bg-[#00b14f]/10 text-[#00b14f] rounded-full text-sm"
            >
              {skill}
              <button
                type="button"
                onClick={() => onRemoveSkill(skill)}
                className="hover:text-red-500 disabled:pointer-events-none"
              >
                <Icon name="close" size={14} />
              </button>
            </span>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-400 mt-2">Tối đa 10 kỹ năng</p>
    </div>
  );
}
