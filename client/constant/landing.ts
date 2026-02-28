export interface Province {
  id: number;
  name: string;
  districts: string[];
}

export interface JobCategory {
  id: number;
  name: string;
  popular: string[];
  subCategories: {
    name: string;
    tags: string[];
  }[];
}

export interface BannerSlide {
  id: number;
  src: string;
  alt: string;
}

export interface Stat {
  number: string;
  title: string;
  desc: string;
}

export interface ProductCategory {
  id: number;
  name: string;
  jobs: number;
  iconType: string;
}

export interface Partner {
  id: number;
  name: string;
  logo: string;
}

export const jobCategories: JobCategory[] = [
  { 
    id: 1, 
    name: "Thi công & Xây dựng",
    popular: [
      "Chỉ huy trưởng công trình",
      "Giám sát thi công",
      "Kỹ sư hiện trường",
      "Đội trưởng thi công",
      "Thợ xây",
      "Thợ sắt",
      "Thợ cốp pha",
      "Thợ điện nước (MEP)",
      "Thợ hàn",
      "Vận hành máy xúc/máy ủi"
    ],
    subCategories: [
      {
        name: "Thi công phần thô",
        tags: [
          "Thi công móng",
          "Thi công cột/dầm/sàn",
          "Xây tô",
          "Lắp dựng cốt thép",
          "Lắp dựng cốp pha"
        ]
      },
      {
        name: "Thi công hoàn thiện",
        tags: [
          "Ốp lát",
          "Sơn bả",
          "Trần thạch cao",
          "Nhôm kính",
          "Chống thấm"
        ]
      },
    ]
  },
  { 
    id: 2, 
    name: "Thiết kế kiến trúc",
    popular: [
      "Kiến trúc sư",
      "Thiết kế nhà phố",
      "Thiết kế biệt thự",
      "Thiết kế mặt bằng",
      "Thiết kế phối cảnh 3D",
      "Triển khai bản vẽ kỹ thuật",
      "Thiết kế nội thất",
      "Thiết kế cảnh quan",
      "Dựng 3D SketchUp",
      "Render Lumion/Enscape"
    ],
    subCategories: [
      {
        name: "Kiến trúc",
        tags: [
          "Thiết kế concept",
          "Thiết kế mặt đứng",
          "Thiết kế mặt cắt",
          "Bố trí công năng",
          "Triển khai hồ sơ xin phép"
        ]
      },
      {
        name: "Nội thất & cảnh quan",
        tags: [
          "Thiết kế nội thất",
          "Bóc tách vật liệu nội thất",
          "Thiết kế tủ bếp",
          "Thiết kế shop/văn phòng",
          "Thiết kế sân vườn"
        ]
      },
    ]
  },
  { 
    id: 3, 
    name: "BIM & Mô phỏng",
    popular: [
      "Dựng mô hình Revit",
      "Triển khai BIM",
      "Phối hợp BIM",
      "Dynamo/Revit API",
      "Dựng kết cấu Tekla",
      "Shop drawing BIM",
      "Clash detection Navisworks",
      "Lập tiến độ 4D",
      "Bóc tách khối lượng 5D",
      "Family Revit"
    ],
    subCategories: [
      {
        name: "Modeling & Drawing",
        tags: [
          "Revit Architecture",
          "Revit Structure",
          "Revit MEP",
          "Triển khai shop drawing",
          "Xuất bản vẽ & thống kê"
        ]
      },
      {
        name: "Coordination",
        tags: [
          "Navisworks",
          "BIM 360/ACC",
          "Clash report",
          "Thiết lập template",
          "Chuẩn hóa LOD"
        ]
      },
    ]
  },
  { 
    id: 4, 
    name: "Vật liệu & Cung ứng",
    popular: [
      "Thu mua vật tư",
      "Kế hoạch vật tư",
      "Quản lý kho công trình",
      "Báo giá vật liệu",
      "Nhà cung cấp bê tông",
      "Nhà cung cấp thép",
      "Thiết bị MEP",
      "Đồ hoàn thiện",
      "Logistics công trường",
      "Điều phối giao hàng"
    ],
    subCategories: [
      {
        name: "Vật tư phần thô",
        tags: [
          "Bê tông thương phẩm",
          "Cốt thép",
          "Gạch/đá/cát",
          "Phụ gia bê tông",
          "Giàn giáo & coppha"
        ]
      },
      {
        name: "Vật tư hoàn thiện",
        tags: [
          "Sơn & bột bả",
          "Gạch ốp lát",
          "Thiết bị vệ sinh",
          "Cửa & nhôm kính",
          "Đèn & thiết bị điện"
        ]
      },
    ]
  },
  { 
    id: 5, 
    name: "Dự toán & Hồ sơ thầu",
    popular: [
      "Kỹ sư dự toán",
      "QS",
      "Bóc tách khối lượng",
      "Lập hồ sơ thầu",
      "Chào giá",
      "Định mức & đơn giá",
      "Thanh toán khối lượng",
      "Quyết toán công trình",
      "Hồ sơ nghiệm thu",
      "Hồ sơ hoàn công"
    ],
    subCategories: [
      {
        name: "Dự toán",
        tags: [
          "Bóc tách theo bản vẽ",
          "Dự toán phần thô",
          "Dự toán hoàn thiện",
          "Dự toán MEP",
          "Dự toán cải tạo"
        ]
      },
      {
        name: "Hồ sơ dự án",
        tags: [
          "Hồ sơ mời thầu",
          "Hồ sơ dự thầu",
          "Hợp đồng & phụ lục",
          "Biên bản nghiệm thu",
          "Hồ sơ hoàn công"
        ]
      },
    ]
  },
  { 
    id: 6, 
    name: "Quản lý dự án",
    popular: [
      "Project Manager (PM)",
      "Site Engineer",
      "Kế hoạch tiến độ",
      "Quản lý chất lượng (QA/QC)",
      "An toàn lao động (HSE)",
      "Kiểm soát khối lượng",
      "Quản lý hợp đồng",
      "Điều phối nhà thầu",
      "Báo cáo công trường",
      "Quản lý vật tư"
    ],
    subCategories: [
      {
        name: "Kế hoạch & kiểm soát",
        tags: [
          "Lập tiến độ Primavera/MS Project",
          "S-curve",
          "Báo cáo tuần/tháng",
          "Nhật ký công trình",
          "Biên bản hiện trường"
        ]
      },
      {
        name: "Chất lượng & an toàn",
        tags: [
          "QA/QC công trình",
          "Checklist nghiệm thu",
          "HSE công trường",
          "Đào tạo an toàn",
          "Đánh giá rủi ro"
        ]
      },
    ]
  },
  { 
    id: 7, 
    name: "Kế toán công trình",
    popular: [
      "Kế toán công trình",
      "Kế toán nội bộ",
      "Theo dõi chi phí công trình",
      "Công nợ nhà thầu",
      "Hóa đơn vật tư",
      "Tạm ứng/hoàn ứng",
      "Báo cáo dòng tiền",
      "Quyết toán công trình",
      "Kế toán thuế",
      "Kế toán kho"
    ],
    subCategories: [
      {
        name: "Chi phí & thanh toán",
        tags: [
          "Theo dõi chi phí theo hạng mục",
          "Thanh toán nhà thầu",
          "Đối chiếu công nợ",
          "Bảng kê vật tư",
          "Tổng hợp khối lượng"
        ]
      },
      {
        name: "Thuế & chứng từ",
        tags: [
          "Hóa đơn đầu vào/đầu ra",
          "Thuế GTGT",
          "Thuế TNDN",
          "Quy trình tạm ứng",
          "Hồ sơ quyết toán"
        ]
      },
    ]
  },
  { 
    id: 8, 
    name: "Pháp lý xây dựng",
    popular: [
      "Hợp đồng xây dựng",
      "Phụ lục hợp đồng",
      "Thanh quyết toán",
      "Giải quyết tranh chấp",
      "Bảo lãnh & bảo hành",
      "Hồ sơ pháp lý dự án",
      "Xin phép xây dựng",
      "Pháp lý nhà thầu",
      "Tuân thủ an toàn",
      "Tư vấn điều khoản phạt"
    ],
    subCategories: [
      {
        name: "Hợp đồng & thủ tục",
        tags: [
          "Soạn thảo hợp đồng EPC",
          "Hợp đồng thi công",
          "Hợp đồng cung ứng",
          "Điều kiện thanh toán",
          "Bảo lãnh thực hiện"
        ]
      },
      {
        name: "Pháp lý dự án",
        tags: [
          "Giấy phép xây dựng",
          "Nghiệm thu PCCC",
          "Hoàn công",
          "Hồ sơ môi trường",
          "Hồ sơ nghiệm thu"
        ]
      },
    ]
  },
  { 
    id: 9, 
    name: "Nhân sự công trường",
    popular: [
      "Tuyển thợ/đội thi công",
      "Chấm công công trường",
      "C&B",
      "Hợp đồng lao động",
      "An toàn lao động",
      "Đào tạo nội quy",
      "Quản lý nhà thầu phụ",
      "Điều phối nhân lực",
      "Hồ sơ nhân sự",
      "Quan hệ lao động"
    ],
    subCategories: [
      {
        name: "Tuyển dụng & điều phối",
        tags: [
          "Tuyển thợ xây",
          "Tuyển thợ sắt",
          "Tuyển thợ MEP",
          "Tuyển giám sát",
          "Điều phối ca kíp"
        ]
      },
      {
        name: "Hồ sơ & chế độ",
        tags: [
          "Chấm công",
          "Tính lương công trình",
          "Bảo hiểm",
          "Kỷ luật an toàn",
          "Hồ sơ nhân sự"
        ]
      },
    ]
  },
  { 
    id: 10, 
    name: "MEP & Kỹ thuật",
    popular: [
      "Kỹ sư điện",
      "Kỹ sư cấp thoát nước",
      "Kỹ sư HVAC",
      "Thiết kế MEP",
      "Shop drawing MEP",
      "Giám sát MEP",
      "PCCC",
      "AutoCAD",
      "Revit MEP",
      "Commissioning"
    ],
    subCategories: [
      {
        name: "Thiết kế & thi công MEP",
        tags: [
          "Thiết kế điện",
          "Thiết kế cấp thoát nước",
          "Thiết kế HVAC",
          "Thiết kế PCCC",
          "Triển khai shop drawing"
        ]
      },
      {
        name: "Kỹ thuật hiện trường",
        tags: [
          "Giám sát lắp đặt",
          "Chạy thử & nghiệm thu",
          "Bảo trì hệ thống",
          "Đo bóc vật tư MEP",
          "As-built MEP"
        ]
      },
    ]
  },
];

export const provinces: Province[] = [
  { id: 1, name: "Hà Nội", districts: ["Ba Đình", "Hoàn Kiếm", "Cầu Giấy", "Đống Đa", "Hai Bà Trưng"] },
  { id: 2, name: "Hồ Chí Minh", districts: ["Quận 1", "Quận 3", "Quận 7", "Bình Thạnh", "Thủ Đức"] },
  { id: 3, name: "Bình Dương", districts: ["Thủ Dầu Một", "Dĩ An", "Thuận An", "Tân Uyên"] },
  { id: 4, name: "Bắc Ninh", districts: ["TP Bắc Ninh", "Từ Sơn", "Yên Phong", "Quế Võ"] },
  { id: 5, name: "Đồng Nai", districts: ["Biên Hòa", "Long Khánh", "Nhơn Trạch", "Long Thành"] },
  { id: 6, name: "Hưng Yên", districts: ["TP Hưng Yên", "Văn Lâm", "Văn Giang", "Mỹ Hào"] },
  { id: 7, name: "Hải Dương", districts: ["TP Hải Dương", "Chí Linh", "Kinh Môn", "Nam Sách"] },
  { id: 8, name: "Đà Nẵng", districts: ["Hải Châu", "Thanh Khê", "Sơn Trà", "Ngũ Hành Sơn"] },
  { id: 9, name: "Cần Thơ", districts: ["Ninh Kiều", "Cái Răng", "Bình Thủy", "Ô Môn"] },
  { id: 10, name: "Hải Phòng", districts: ["Hồng Bàng", "Lê Chân", "Ngô Quyền", "Kiến An"] },
];

export const bannerSlides: BannerSlide[] = [
  { id: 1, src: "/landing/slide1.png", alt: "Banner 1" },
  { id: 2, src: "/landing/slide2.png", alt: "Banner 2" },
  { id: 3, src: "/landing/slide3.png", alt: "Banner 3" },
  { id: 4, src: "/landing/slide4.png", alt: "Banner 4" },
];

export const stats: Stat[] = [
  { 
    number: "18M+", 
    title: "Freelancer đã đăng ký",
    desc: "Tìm kiếm chuyên gia phù hợp với dự án của bạn từ mạng lưới freelancer lớn nhất"
  },
  { 
    number: "8.000+", 
    title: "Kỹ năng chuyên môn",
    desc: "Từ phát triển web, thiết kế đồ họa đến AI, blockchain và nhiều hơn nữa"
  },
  { 
    number: "5M+", 
    title: "Dự án đã hoàn thành",
    desc: "Kết nối khách hàng với freelancer chất lượng cao trên toàn thế giới"
  },
  { 
    number: "4.9/5", 
    title: "Đánh giá trung bình",
    desc: "Hàng triệu khách hàng hài lòng với chất lượng dịch vụ freelancer"
  },
];

export const productCategories: ProductCategory[] = [
  { id: 1, name: "Thi công & Xây dựng", jobs: 7938, iconType: "dev" },
  { id: 2, name: "Thiết kế kiến trúc", jobs: 5640, iconType: "design" },
  { id: 3, name: "BIM & Mô phỏng", jobs: 2005, iconType: "ai" },
  { id: 4, name: "Vật liệu & Cung ứng", jobs: 2465, iconType: "marketing" },
  { id: 5, name: "Dự toán & Hồ sơ thầu", jobs: 1892, iconType: "writing" },
  { id: 6, name: "Quản lý dự án", jobs: 1283, iconType: "admin" },
  { id: 7, name: "Kế toán công trình", jobs: 4572, iconType: "finance" },
  { id: 8, name: "Pháp lý xây dựng", jobs: 343, iconType: "legal" },
  { id: 9, name: "Nhân sự công trường", jobs: 1456, iconType: "hr" },
  { id: 10, name: "MEP & Kỹ thuật", jobs: 2134, iconType: "engineering" },
];

export const partners: Partner[] = [
  { id: 1, name: "Partner 1", logo: "/1-sao.png" },
  { id: 2, name: "Partner 2", logo: "/2-sao.png" },
  { id: 3, name: "Partner 3", logo: "/3-sao.png" },
  { id: 4, name: "Freelancer", logo: "/logo.svg" },
  { id: 5, name: "Partner 5", logo: "/1-sao.png" },
  { id: 6, name: "Partner 6", logo: "/2-sao.png" },
  { id: 7, name: "Partner 7", logo: "/3-sao.png" },
  { id: 8, name: "Partner 8", logo: "/logo.svg" },
];

export const popularKeywords: string[] = [
  "cv là gì",
  "Mẫu CV",
  "mẫu cv tiếng việt",
  "Sơ yếu lý lịch",
  "CV tham khảo",
  "tổng hợp CV tham khảo cho lập trình viên",
  "giấy tờ thủ tục hồ sơ xin việc",
  "Email xin việc bằng tiếng anh",
  "Mẫu đơn xin việc",
  "mẫu đơn xin nghỉ việc",
  "Cách viết đơn xin nghỉ phép",
  "Cách viết CV xin việc",
  "cách viết CV Ngành Kinh doanh/Bán hàng",
  "cách viết CV Ngành Kế Toán/Kiểm Toán",
  "cách viết CV Ngành Nhân Sự",
  "cách viết CV xin Học bổng",
  "cách viết CV Tiếng Anh",
  "cách viết CV Tiếng Nhật",
  "cách viết CV Tiếng Trung",
  "cách viết CV Tiếng Hàn",
  "cẩm nang năm nhất cho sinh viên",
  "Mẫu đơn xin thực tập",
  "Hướng dẫn sửa lỗi gõ tiếng Việt",
  "Ngành du lịch làm việc gì",
  "Cẩm nang xin việc ngành nhân sự",
  "Xin việc ngành công nghệ thông tin",
  "Cẩm nang xin việc ngành marketing",
  "Cẩm nang xin việc ngành kế toán kiểm toán",
  "Cẩm nang xin việc ngành công nghệ thực phẩm",
  "Cẩm nang xin việc ngành tài chính ngân hàng",
  "Cẩm nang xin việc ngành luật",
  "Cẩm nang xin việc ngành xây dựng - địa ốc",
  "Trắc nghiệm tính cách MBTI",
  "Việc làm online tại nhà",
  "Tìm việc làm tại TP. HCM",
  "Cách viết cover letter xin việc",
  "CV xin việc bằng tiếng Anh",
  "CV cho sinh viên chưa tốt nghiệp",
  "Việc làm hành chính nhân sự",
  "Thư xin việc bằng tiếng Anh",
  "Ngành logistic là gì",
  "Việc làm Hải Phòng",
  "Việc làm Bình Định",
  "Tuyển dụng Content Marketing",
  "Tuyển lập trình viên PHP",
  "Tuyển lập trình viên Java",
  "Tuyển lập trình viên .Net",
  "Tuyển dụng nhân viên kinh doanh",
  "Tuyển dụng nhân viên marketing",
  "Tìm việc kế toán",
];
