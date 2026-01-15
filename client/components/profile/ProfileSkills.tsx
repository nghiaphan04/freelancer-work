"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Icon from "@/components/ui/Icon";

interface ProfileSkillsProps {
  skills?: string[];
  onUpdate: (data: { skills: string[] }) => Promise<boolean>;
  isLoading?: boolean;
}

export default function ProfileSkills({ skills = [], onUpdate, isLoading }: ProfileSkillsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editedSkills, setEditedSkills] = useState<string[]>(skills);
  const [newSkill, setNewSkill] = useState("");

  const handleOpenEdit = () => {
    setEditedSkills([...skills]);
    setNewSkill("");
    setIsEditOpen(true);
  };

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !editedSkills.includes(trimmed) && editedSkills.length < 20) {
      setEditedSkills([...editedSkills, trimmed]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setEditedSkills(editedSkills.filter((s) => s !== skillToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleSave = async () => {
    const success = await onUpdate({ skills: editedSkills });
    if (success) {
      setIsEditOpen(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Kỹ năng</h2>
          <button
            onClick={handleOpenEdit}
            className="text-gray-500 hover:text-[#00b14f]"
          >
            <Icon name={skills.length > 0 ? "edit" : "add"} size={18} />
          </button>
        </div>

        {skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1 bg-[#00b14f]/10 text-[#00b14f] rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <button
            onClick={handleOpenEdit}
            className="text-gray-400 hover:text-[#00b14f] flex items-center gap-2"
          >
            <Icon name="add" size={16} />
            Thêm kỹ năng của bạn
          </button>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => !isLoading && setIsEditOpen(open)}>
        <DialogContent className="sm:max-w-[500px]" onPointerDownOutside={(e) => isLoading && e.preventDefault()} onEscapeKeyDown={(e) => isLoading && e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa kỹ năng</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {/* Add new skill */}
            <div className="flex gap-2 mb-4">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập kỹ năng mới..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddSkill}
                disabled={isLoading || !newSkill.trim() || editedSkills.length >= 20}
              >
                Thêm
              </Button>
            </div>

            {editedSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {editedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-[#00b14f]/10 text-[#00b14f] rounded-full text-sm"
                  >
                    {skill}
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading}
                    >
                      <Icon name="close" size={14} />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-4">
                Chưa có kỹ năng nào. Thêm kỹ năng của bạn ở trên.
              </p>
            )}
            <p className="text-xs text-gray-400 mt-2">Tối đa 20 kỹ năng</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isLoading}>
              Hủy
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-[#00b14f] hover:bg-[#009643]"
            >
              {isLoading ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
