import { useState } from "react";
import { FormData } from "./usePostJobForm";

export function useSkills(
  formData: FormData,
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
) {
  const [skillInput, setSkillInput] = useState("");

  const addSkill = () => {
    const skill = skillInput.trim();
    if (skill && formData.skills && formData.skills.length < 10 && !formData.skills.includes(skill)) {
      setFormData((prev) => ({
        ...prev,
        skills: [...(prev.skills || []), skill],
      }));
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills?.filter((s) => s !== skillToRemove) || [],
    }));
  };

  return {
    skillInput,
    setSkillInput,
    addSkill,
    removeSkill,
  };
}
