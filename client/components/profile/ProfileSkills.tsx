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
    if (trimmed && !editedSkills.includes(trimmed)) {
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
            className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded-full"
          >
            <Icon name={skills.length > 0 ? "edit" : "add"} size={18} />
          </button>
        </div>

        {skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
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
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
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
              />
              <Button
                type="button"
                onClick={handleAddSkill}
                disabled={!newSkill.trim()}
                className="bg-[#00b14f] hover:bg-[#009643]"
              >
                Thêm
              </Button>
            </div>

            {/* Skills list */}
            {editedSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {editedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm flex items-center gap-1 group"
                  >
                    {skill}
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-1 text-gray-400 hover:text-red-500"
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
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
