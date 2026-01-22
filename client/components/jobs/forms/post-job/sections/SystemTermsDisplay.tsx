"use client";

interface SystemTermsDisplayProps {
  budget: number;
  submissionDays: number;
  reviewDays: number;
  platformFeePercent: number;
  startIndex: number;
}

export default function SystemTermsDisplay({
  budget,
  submissionDays,
  reviewDays,
  platformFeePercent,
  startIndex,
}: SystemTermsDisplayProps) {
  const FREELANCER_FEE = 10;
  
  const systemTerms = [
    {
      title: "Cơ chế ký quỹ (Escrow)",
      content: `Toàn bộ số tiền thanh toán (${budget} APT) cùng phí nền tảng (${platformFeePercent}%) sẽ được khóa trong Smart Contract trên blockchain Aptos ngay khi tạo công việc. Tiền được giữ an toàn và chỉ được giải phóng khi đáp ứng một trong các điều kiện: (a) Bên A chủ động duyệt và nghiệm thu sản phẩm, (b) Hết thời hạn nghiệm thu ${reviewDays} phút mà Bên A không có phản hồi - tiền tự động chuyển cho Bên B, hoặc (c) Có phán quyết chính thức từ hệ thống giải quyết tranh chấp.`
    },
    {
      title: "Phí nền tảng và thanh toán",
      content: `Bên A chịu phí nền tảng ${platformFeePercent}% trên giá trị hợp đồng (${(budget * platformFeePercent / 100).toFixed(4)} APT), được thu ngay khi tạo escrow. Bên B chịu phí dịch vụ ${FREELANCER_FEE}% trên số tiền nhận được, được trừ tự động khi thanh toán hoàn tất. Số tiền thực nhận của Bên B: ${(budget * (100 - FREELANCER_FEE) / 100).toFixed(4)} APT.`
    },
    {
      title: "Quy trình ký hợp đồng",
      content: "Hợp đồng được ký theo quy trình 2 bước: (1) Bên A ký khi tạo công việc và ký quỹ, (2) Bên B ký khi được gán và chấp nhận công việc. Cả hai chữ ký đều được xác thực bằng hash trên blockchain. Thời gian làm việc chỉ bắt đầu tính từ khi Bên B hoàn tất ký hợp đồng."
    },
    {
      title: "Thời hạn ký hợp đồng",
      content: "Bên B phải ký hợp đồng trong vòng 1p30s kể từ khi Bên A duyệt đơn ứng tuyển. Nếu quá 1p30s không ký: (a) Bên B bị xóa khỏi công việc, (b) Công việc quay về trạng thái mở để nhận ứng tuyển mới, (c) Điểm uy tín của Bên B bị trừ 5 điểm và cộng 10 điểm bất tín nhiệm. Bên B có quyền từ chối ký hợp đồng trong thời hạn 1p30s này mà không bị phạt - công việc sẽ quay về trạng thái mở. Bên A cũng có quyền hủy công việc trước khi Bên B ký và nhận lại tiền ký quỹ (không bao gồm phí nền tảng)."
    },
    {
      title: "Quyền hủy công việc của Bên A",
      content: `Bên A có quyền hủy công việc trong các trường hợp: (1) Chưa gán người làm: nhận lại tiền ký quỹ (không bao gồm phí nền tảng). (2) Đã gán người làm nhưng chưa ký hợp đồng: phải chịu phí phạt 40% giá trị công việc (${(budget * 0.4).toFixed(4)} APT), nhận lại 60% còn lại. (3) Sau khi Bên B đã ký và bắt đầu làm việc: không thể hủy trực tiếp, phải thông qua: (a) Bên B tự rút, (b) Bên B quá hạn nộp sản phẩm, hoặc (c) Giải quyết tranh chấp.`
    },
    {
      title: "Quyền rút khỏi công việc của Bên B",
      content: `Bên B có quyền tự nguyện rút khỏi công việc trước khi nộp sản phẩm. Khi rút: (a) Bên B phải trả phí phạt 12% giá trị công việc (${(budget * 0.12).toFixed(4)} APT), (b) Bên B không nhận được thanh toán, (c) Công việc quay về trạng thái chờ gán người mới, (d) Điểm uy tín của Bên B bị trừ 5 điểm và cộng 10 điểm bất tín nhiệm.`
    },
    {
      title: "Xử lý quá hạn nộp sản phẩm",
      content: `Nếu Bên B không nộp sản phẩm trong thời hạn ${submissionDays} phút: (a) Hệ thống tự động xóa người làm, (b) Bên B bị xóa khỏi công việc và không nhận thanh toán, (c) Công việc quay về trạng thái chờ gán người mới, (d) Điểm uy tín của Bên B bị trừ 5 điểm và cộng 10 điểm bất tín nhiệm.`
    },
    {
      title: "Xử lý quá hạn nghiệm thu",
      content: `Nếu Bên A không nghiệm thu hoặc yêu cầu chỉnh sửa trong thời hạn ${reviewDays} ngày sau khi Bên B nộp sản phẩm: (a) Bất kỳ ai cũng có thể kích hoạt thanh toán tự động cho Bên B, (b) Điểm uy tín của Bên A bị trừ 5 điểm và cộng 10 điểm bất tín nhiệm.`
    },
    {
      title: "Quyền yêu cầu chỉnh sửa",
      content: `Trong thời hạn nghiệm thu ${reviewDays} phút, Bên A có quyền yêu cầu Bên B chỉnh sửa sản phẩm. Khi yêu cầu chỉnh sửa: (a) Trạng thái sản phẩm được reset, (b) Bên B có thêm ${submissionDays} phút để nộp lại, (c) Không giới hạn số lần yêu cầu chỉnh sửa trong thời hạn nghiệm thu.`
    },
    {
      title: "Cơ chế tranh chấp",
      content: `Bên A có quyền mở tranh chấp trong thời hạn nghiệm thu nếu không hài lòng với sản phẩm. Quy trình tranh chấp: (1) Cả hai bên nộp bằng chứng lên hệ thống trong 3 phút, (2) 3 admin được chọn ngẫu nhiên để vote, (3) Mỗi admin có 3 phút để vote, (4) Bên có 2/3 phiếu bầu sẽ thắng. Bên thắng nhận toàn bộ tiền ký quỹ.`
    },
    {
      title: "Hệ thống điểm uy tín (Reputation)",
      content: `Điểm uy tín được tính tự động: CỘNG ĐIỂM TÍN NHIỆM: Hoàn thành công việc +10 điểm, Nghiệm thu đúng hạn +5 điểm, Thắng tranh chấp +5 điểm. TRỪ ĐIỂM VÀ CỘNG BẤT TÍN NHIỆM: Thua tranh chấp -10 điểm tín nhiệm và +20 điểm bất tín nhiệm, Quá hạn nộp/nghiệm thu -5 điểm tín nhiệm và +10 điểm bất tín nhiệm.`
    },
    {
      title: "Cam kết với hệ thống",
      content: "Bằng việc ký hợp đồng này, cả hai bên xác nhận: (a) Đã đọc và hiểu toàn bộ điều khoản, (b) Cam kết tuân thủ các quy định của Smart Contract, (c) Chấp nhận mọi giao dịch được ghi nhận công khai và minh bạch trên blockchain Aptos, (d) Công nhận chữ ký số trên hợp đồng có giá trị pháp lý tương đương chữ ký tay."
    },
  ];

  return (
    <>
      {systemTerms.map((term, index) => (
        <div key={index} className="mb-3">
          <p className="text-justify">
            <span className="font-semibold">Điều {startIndex + index + 1}. {term.title}</span>
            {": "}
            <span className="text-gray-700 whitespace-pre-line">{term.content}</span>
          </p>
        </div>
      ))}
    </>
  );
}
