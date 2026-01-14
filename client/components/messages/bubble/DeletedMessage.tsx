interface DeletedMessageProps {
  isMe: boolean;
}

export default function DeletedMessage({ isMe }: DeletedMessageProps) {
  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div className="px-4 py-2.5 rounded-3xl bg-gray-100 text-gray-400 italic text-sm">
        Tin nhắn đã bị xóa
      </div>
    </div>
  );
}
