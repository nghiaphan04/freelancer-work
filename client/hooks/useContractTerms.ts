import { useState, useCallback } from "react";

export interface ContractTerm {
  title: string;
  content: string;
}

export const DEFAULT_CONTRACT_TERMS: ContractTerm[] = [
  { 
    title: "Phạm vi công việc", 
    content: "Bên B (Freelancer) cam kết thực hiện đầy đủ và chính xác các công việc được mô tả trong phần \"Mô tả công việc\" và \"Sản phẩm bàn giao\". Mọi thay đổi về phạm vi công việc phải được sự đồng ý bằng văn bản của cả hai bên." 
  },
  { 
    title: "Thời hạn thực hiện", 
    content: "Bên B phải hoàn thành và bàn giao sản phẩm trong thời hạn quy định kể từ ngày ký hợp đồng. Trường hợp cần gia hạn, Bên B phải thông báo bằng văn bản cho Bên A ít nhất 3 phút trước thời hạn và phải được Bên A chấp thuận." 
  },
  { 
    title: "Nghiệm thu và thanh toán", 
    content: "Bên A có trách nhiệm nghiệm thu sản phẩm trong thời gian quy định. Nếu sản phẩm đạt yêu cầu, tiền sẽ được giải phóng từ escrow cho Bên B. Nếu không phản hồi trong thời gian nghiệm thu, sản phẩm được coi là đã được chấp nhận." 
  },
  { 
    title: "Chính sách chỉnh sửa", 
    content: "Bên B cam kết thực hiện tối đa 03 (ba) lần chỉnh sửa miễn phí theo yêu cầu hợp lý của Bên A trong phạm vi công việc ban đầu. Các yêu cầu chỉnh sửa vượt quá phạm vi hoặc số lần quy định sẽ được thương lượng và tính phí bổ sung." 
  },
  { 
    title: "Bảo mật thông tin", 
    content: "Bên B cam kết giữ bí mật tuyệt đối mọi thông tin, tài liệu, dữ liệu liên quan đến dự án và hoạt động kinh doanh của Bên A. Nghĩa vụ bảo mật này có hiệu lực trong suốt thời gian thực hiện hợp đồng và 02 (hai) năm sau khi hợp đồng kết thúc." 
  },
  { 
    title: "Quyền sở hữu trí tuệ", 
    content: "Sau khi thanh toán hoàn tất, toàn bộ quyền sở hữu trí tuệ đối với sản phẩm bao gồm nhưng không giới hạn: mã nguồn, thiết kế, tài liệu kỹ thuật, và các tài sản số khác sẽ thuộc quyền sở hữu hoàn toàn và vĩnh viễn của Bên A." 
  },
  { 
    title: "Cam kết không cạnh tranh", 
    content: "Trong thời gian thực hiện hợp đồng, Bên B cam kết không thực hiện các công việc tương tự cho đối thủ cạnh tranh trực tiếp của Bên A mà không có sự đồng ý bằng văn bản của Bên A." 
  },
  { 
    title: "Chấm dứt hợp đồng", 
    content: "Nếu Bên B đơn phương chấm dứt hợp đồng mà không có lý do chính đáng, Bên B sẽ không được nhận thanh toán. Nếu Bên A chấm dứt hợp đồng khi Bên B đã hoàn thành trên 50% công việc, Bên B sẽ được nhận 50% giá trị hợp đồng." 
  },
  { 
    title: "Giải quyết tranh chấp", 
    content: "Mọi tranh chấp phát sinh từ hoặc liên quan đến hợp đồng này sẽ được giải quyết thông qua cơ chế hòa giải của nền tảng. Nếu không đạt được thỏa thuận, tranh chấp sẽ được giải quyết bởi trọng tài viên được chỉ định bởi nền tảng." 
  },
  { 
    title: "Điều khoản chung", 
    content: "Bên B phải cập nhật tiến độ công việc ít nhất 02 (hai) lần mỗi tuần. Bên B cam kết sử dụng các công cụ và phương pháp chuyên nghiệp để đảm bảo chất lượng sản phẩm. Hợp đồng này được xác nhận bằng chữ ký số trên blockchain và có giá trị pháp lý tương đương hợp đồng văn bản." 
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
