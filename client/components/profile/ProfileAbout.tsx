"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Icon from "@/components/ui/Icon";

interface ProfileAboutProps {
  bio?: string;
  onUpdate: (data: { bio: string }) => Promise<boolean>;
  isLoading?: boolean;
}

export default function ProfileAbout({ bio, onUpdate, isLoading }: ProfileAboutProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedBio, setEditedBio] = useState(bio || "");

  const handleEdit = () => {
    setEditedBio(bio || "");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedBio(bio || "");
    setIsEditing(false);
  };

  const handleSave = async () => {
    const success = await onUpdate({ bio: editedBio });
    if (success) {
      setIsEditing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Giới thiệu</h2>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="text-gray-500 hover:text-[#00b14f]"
          >
            <Icon name={bio ? "edit" : "add"} size={18} />
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <Textarea
            value={editedBio}
            onChange={(e) => setEditedBio(e.target.value)}
            placeholder="Viết giới thiệu về bản thân bạn..."
            className="min-h-[120px] resize-none"
            maxLength={5000}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {editedBio.length}/5000 ký tự
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isLoading}
                className="bg-[#00b14f] hover:bg-[#009643]"
              >
                {isLoading ? "Đang lưu..." : "Lưu"}
              </Button>
            </div>
          </div>
        </div>
      ) : bio ? (
        <p className="text-gray-600 whitespace-pre-wrap">{bio}</p>
      ) : (
        <button
          onClick={handleEdit}
          className="text-gray-400 hover:text-[#00b14f] flex items-center gap-2"
        >
          <Icon name="add" size={16} />
          Thêm giới thiệu về bản thân
        </button>
      )}
    </div>
  );
}
