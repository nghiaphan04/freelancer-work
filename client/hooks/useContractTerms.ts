import { useState, useCallback } from "react";

export interface ContractTerm {
  title: string;
  content: string;
}

export const DEFAULT_CONTRACT_TERMS: ContractTerm[] = [
  {
    title: "Đối tượng và phạm vi công việc",
    content: `
<p>Hợp đồng dịch vụ này điều chỉnh việc Bên B cung cấp dịch vụ chuyên môn cho Bên A theo đúng nội dung đã nêu tại phần
<strong>“Mô tả công việc”</strong> và <strong>“Sản phẩm bàn giao”</strong> trên hệ thống.</p>
<p>Phạm vi công việc bao gồm nhưng không giới hạn trong các nội dung sau:</p>
<ul>
  <li>Các hạng mục, khối lượng và tiêu chuẩn kỹ thuật đã được Bên A mô tả khi đăng công việc;</li>
  <li>Các điều khoản bổ sung mà hai bên thống nhất thông qua tính năng “Điều khoản hợp đồng”;</li>
  <li>Các hướng dẫn, yêu cầu chi tiết được trao đổi, xác nhận bằng văn bản trên nền tảng.</li>
</ul>
<p>Mọi yêu cầu bổ sung làm phát sinh thêm khối lượng, thay đổi giải pháp hoặc mục tiêu so với phạm vi ban đầu được coi là thay đổi phạm vi công việc và phải được hai bên thỏa thuận lại trên hệ thống về giá trị và thời hạn thực hiện.</p>`
  },
  {
    title: "Thời gian thực hiện và thời gian đánh giá",
    content: `
<p>Tổng thời gian thực hiện thuần của Bên B được xác định theo trường thời gian mà Bên A nhập khi tạo công việc.</p>
<p>Cách tính và quản lý thời gian:</p>
<ul>
  <li>Khi Bên B đang thực hiện, thời gian thực hiện công việc được tính liên tục cho đến khi Bên B nộp sản phẩm lần đầu trên hệ thống;</li>
  <li>Tại thời điểm nộp, thời gian thực hiện công việc tạm dừng và thời hạn xem xét, nghiệm thu của Bên A bắt đầu;</li>
  <li>Thời gian thực hiện công việc chỉ chạy lại khi Bên A gửi phản hồi hoặc yêu cầu chỉnh sửa cụ thể cho Bên B.</li>
</ul>
<p>Bên A có trách nhiệm đánh giá trong thời hạn nghiệm thu đã khai báo; nếu hết thời hạn này mà không có phản hồi hợp lệ trên hệ thống thì được hiểu là Bên A tạm chấp thuận về mặt tiến độ đối với sản phẩm đã bàn giao.</p>`
  },
  {
    title: "Chất lượng, sản phẩm và nghiệm thu",
    content: `
<p>Bên B có nghĩa vụ thực hiện công việc đúng quy cách, tiêu chuẩn, quy chuẩn chuyên môn và đúng dữ liệu đầu vào do Bên A cung cấp.</p>
<p>Sản phẩm bàn giao phải thể hiện rõ:</p>
<ul>
  <li>Các hạng mục và kết quả đầu ra đã liệt kê tại phần “Sản phẩm bàn giao”;</li>
  <li>Các giả định, tiêu chuẩn kỹ thuật, tài liệu tham chiếu mà Bên B sử dụng trong quá trình thực hiện;</li>
  <li>Các file nguồn, báo cáo, bảng tính hoặc bản vẽ (nếu có) ở định dạng mà hai bên đã thống nhất.</li>
</ul>
<p>Bên A nghiệm thu dựa trên: (i) phạm vi công việc; (ii) tài liệu đầu vào; (iii) tiêu chuẩn áp dụng; (iv) sản phẩm thực tế.
Khi sản phẩm đáp ứng các tiêu chí trên, Bên A có trách nhiệm xác nhận nghiệm thu để hệ thống giải phóng khoản thanh toán tương ứng
từ escrow cho Bên B.</p>`
  },
  {
    title: "Chỉnh sửa và thay đổi phạm vi",
    content: `
<p>Bên B thực hiện tối đa <strong>03 (ba) vòng chỉnh sửa miễn phí</strong> đối với các lỗi kỹ thuật hoặc sai sót so với phạm vi đã thống nhất ban đầu.</p>
<p>Nguyên tắc chỉnh sửa:</p>
<ul>
  <li>Mỗi vòng chỉnh sửa, Bên A cần tổng hợp đầy đủ các yêu cầu vào <strong>một</strong> danh sách, ghi rõ vị trí và nội dung cần điều chỉnh;</li>
  <li>Các yêu cầu mang tính thay đổi ý tưởng, thay đổi tiêu chuẩn, mở rộng thêm hạng mục mới được xem là <em>thay đổi phạm vi</em>
      (scope change) chứ không phải sửa lỗi;</li>
  <li>Đối với các thay đổi phạm vi, hai bên sẽ thương lượng lại về chi phí và thời hạn; Bên B có quyền từ chối nếu Bên A không chấp nhận
      điều chỉnh tương ứng.</li>
</ul>`
  },
  {
    title: "Tạm ứng, thanh toán và chậm trễ",
    content: `
<p>Giá trị hợp đồng, mức tạm ứng (nếu có) và tiến độ thanh toán được xác định theo ngân sách và điều khoản thanh toán mà Bên A khai báo trên hệ thống.</p>
<p>Các nguyên tắc chính:</p>
<ul>
  <li>Mọi khoản thanh toán đều đi qua cơ chế ký quỹ (escrow) và chỉ được giải phóng cho Bên B khi: (i) Bên A nghiệm thu; hoặc
      (ii) hệ thống xử lý tự động do quá hạn nghiệm thu; hoặc (iii) có phán quyết từ cơ chế phân xử tranh chấp;</li>
  <li>Nếu Bên B chậm bàn giao vượt quá thời gian thực hiện thuần mà không có lý do chính đáng, Bên A có quyền áp dụng các chế tài của nền tảng
      (phạt trễ hạn, hủy việc, điều chỉnh điểm uy tín...);</li>
  <li>Nếu Bên A cố ý trì hoãn nghiệm thu hoặc từ chối thanh toán trong khi sản phẩm đã đáp ứng đúng phạm vi, Bên B có quyền yêu cầu mở tranh chấp
      để bảo vệ quyền lợi.</li>
</ul>`
  },
  {
    title: "Bảo mật và quyền sử dụng tài liệu",
    content: `
<p>Hai bên cam kết bảo mật mọi thông tin, dữ liệu, hồ sơ, tài liệu liên quan đến công việc; chỉ sử dụng cho mục đích thực hiện hợp đồng và không tiết lộ cho bên thứ ba nếu không có sự đồng ý của bên còn lại, trừ trường hợp phải cung cấp cho cơ quan có thẩm quyền hoặc hội đồng phân xử tranh chấp.</p>
<p>Về bàn giao và quyền sử dụng tài liệu:</p>
<ul>
  <li>Trước khi thanh toán đầy đủ, Bên B có thể bàn giao sản phẩm dưới dạng bản xem thử (PDF, ảnh chụp, video, file có watermark...);</li>
  <li>File gốc hoàn chỉnh (bao gồm toàn bộ dữ liệu, mô hình, công thức...) chỉ được bàn giao khi khoản thanh toán tương ứng đã được giải ngân
      từ escrow;</li>
  <li>Sau khi thanh toán xong, Bên A được quyền sử dụng sản phẩm cho mục đích dự án; Bên B vẫn được ghi nhận quyền tác giả phù hợp với pháp luật
      về sở hữu trí tuệ (nếu áp dụng).</li>
</ul>`
  },
  {
    title: "Khiếu nại và giải quyết tranh chấp",
    content: `
<p>Mọi khiếu nại liên quan đến chất lượng, khối lượng, tiến độ hoặc thanh toán phải được gửi qua hệ thống, kèm theo mô tả cụ thể và minh chứng phù hợp
(tài liệu đầu vào, phiên bản sản phẩm đã bàn giao, lịch sử trao đổi, log thời gian...).</p>
<p>Quy trình chung:</p>
<ul>
  <li>Bước 1 – Thương lượng: hai bên ưu tiên trao đổi, điều chỉnh trong thời hạn mà nền tảng cho phép;</li>
  <li>Bước 2 – Tranh chấp: nếu không đạt được thỏa thuận, mỗi bên có thể yêu cầu kích hoạt cơ chế phân xử tranh chấp của nền tảng;</li>
  <li>Bước 3 – Phán quyết: hội đồng Verifier/chuyên gia xem xét hồ sơ và bỏ phiếu; kết quả được thực thi tự động bởi smart contract để
      phân bổ số tiền ký quỹ và cập nhật điểm uy tín của các bên.</li>
</ul>`
  },
  {
    title: "Điều khoản chung và hiệu lực on-chain",
    content: `
<p>Các điều khoản hợp đồng trong phần này sẽ được hệ thống hash và lưu trên blockchain cùng với thông tin ký quỹ của công việc.</p>
<ul>
  <li>Sau khi cả hai bên ký và giao dịch tạo escrow được xác nhận, nội dung điều khoản trở thành một phần của trạng thái on-chain
      và không thể đơn phương sửa đổi;</li>
  <li>Mọi thay đổi tiếp theo (nếu có) phải được lập thành điều khoản mới hoặc hợp đồng mới và được hai bên cùng chấp thuận;</li>
  <li>Hai bên cam kết đọc kỹ, hiểu rõ rủi ro và quyền lợi trước khi chấp nhận ký trên hệ thống; các hành vi lợi dụng kẽ hở để trục lợi,
      quỵt tiền hoặc từ chối nghĩa vụ mà không có căn cứ kỹ thuật có thể dẫn tới việc giảm uy tín và bị hạn chế quyền tham gia giao dịch
      trên nền tảng.</li>
</ul>`
  },
];

export function useContractTerms(initialTerms?: ContractTerm[]) {
  const [terms, setTerms] = useState<ContractTerm[]>(initialTerms ?? DEFAULT_CONTRACT_TERMS);

  const initTerms = useCallback((newTerms: ContractTerm[]) => {
    setTerms(newTerms.length > 0 ? newTerms : DEFAULT_CONTRACT_TERMS);
  }, []);

  const addTerm = () => {
    setTerms((prev) => [...prev, { title: "", content: "" }]);
  };

  const updateTerm = (index: number, field: "title" | "content", value: string) => {
    setTerms((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeTerm = (index: number) => {
    setTerms((prev) => prev.filter((_, i) => i !== index));
  };

  return {
    terms,
    setTerms: initTerms,
    addTerm,
    updateTerm,
    removeTerm,
  };
}
