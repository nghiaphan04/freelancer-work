"use client";

import React, { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  className?: string;
  placeholder?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  className,
  placeholder,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[80px] text-gray-800",
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", false);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div
      className={cn(
        "border rounded-md px-3 py-2 bg-white hover:border-gray-300 transition-colors",
        className
      )}
    >
      {placeholder && !value && (
        <p className="text-xs text-gray-400 mb-1">{placeholder}</p>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

