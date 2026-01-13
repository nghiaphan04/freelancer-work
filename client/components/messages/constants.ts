import { Conversation, Message } from "./types";

export const DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: 1,
    user: { id: 1, name: "Nguyễn Văn A", avatar: "", online: true },
    lastMessage: "Chào bạn, tôi rất quan tâm đến dự án của bạn.",
    time: "5 phút",
    unread: 2,
  },
  {
    id: 2,
    user: { id: 2, name: "Trần Thị B", avatar: "", online: false },
    lastMessage: "Cảm ơn bạn đã hoàn thành công việc!",
    time: "1 giờ",
    unread: 0,
  },
  {
    id: 3,
    user: { id: 3, name: "Lê Minh C", avatar: "", online: true },
    lastMessage: "Bạn có thể bắt đầu vào ngày mai không?",
    time: "2 giờ",
    unread: 1,
  },
];

export const DEMO_MESSAGES: Record<number, Message[]> = {
  1: [
    { id: 1, sender: "other", text: "Chào bạn!", time: "10:00" },
    { id: 2, sender: "me", text: "Chào bạn, tôi có thể giúp gì cho bạn?", time: "10:01" },
    { id: 3, sender: "other", text: "Tôi rất quan tâm đến dự án thiết kế website của bạn.", time: "10:02" },
    { id: 4, sender: "other", text: "Bạn có thể cho tôi biết thêm chi tiết không?", time: "10:02" },
    { id: 5, sender: "me", text: "Vâng, đây là dự án thiết kế website bán hàng. Deadline là 2 tuần.", time: "10:05" },
    { id: 6, sender: "other", text: "Nghe tuyệt vời! Tôi có kinh nghiệm làm các dự án tương tự.", time: "10:06" },
  ],
  2: [
    { id: 1, sender: "other", text: "Chào bạn!", time: "09:00" },
    { id: 2, sender: "me", text: "Chào chị!", time: "09:01" },
    { id: 3, sender: "other", text: "Cảm ơn bạn đã hoàn thành công việc!", time: "09:30" },
  ],
  3: [
    { id: 1, sender: "other", text: "Hi!", time: "08:00" },
    { id: 2, sender: "me", text: "Xin chào!", time: "08:05" },
    { id: 3, sender: "other", text: "Bạn có thể bắt đầu vào ngày mai không?", time: "08:10" },
  ],
};
