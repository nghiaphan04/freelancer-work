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
    name: "Phát triển & CNTT",
    popular: [
      "Lập trình viên Ada", "Kiểm thử Blockchain", "Lập trình Backend Amazon", 
      "Lập trình viên Yeoman", "Lập trình viên nghiên cứu", "Lập trình viên Twitter API",
      "Lập trình viên UI", "Lập trình viên Schema", "Lập trình viên từ xa", "Kỹ sư Java"
    ],
    subCategories: [
      { name: "Web & Mobile", tags: ["Lập trình viên Web", "Lập trình viên Web Ấn Độ", "Lập trình Game 2D", "Lập trình viên phần mềm", "Lập trình viên Google API"] },
      { name: "Hệ thống & Cloud", tags: ["Lập trình viên Chrome OS", "Chuyên gia BLOOM", "Chuyên gia GPT Neo", "Tư vấn đổi mới", "Kỹ sư Big Data"] },
    ]
  },
  { 
    id: 2, 
    name: "Thiết kế & Sáng tạo",
    popular: [
      "Thiết kế tài nguyên Game 2D", "Thiết kế Game 2D", "Thiết kế trang sức thủ công",
      "Thiết kế trang phục", "Thiết kế hoa", "Biên kịch hành động",
      "Thiết kế đánh giá", "Thiết kế Marketing", "Thiết kế đồ họa", "Chuyên gia Adobe Photoshop"
    ],
    subCategories: [
      { name: "Video & Âm thanh", tags: ["Biên tập video Youtube", "Chuyên gia Final Cut Pro X", "Biên tập video", "Kỹ sư âm thanh", "Kỹ sư mixing"] },
      { name: "Thiết kế & Minh họa", tags: ["Thiết kế Logo", "Họa sĩ nền 2D Animation", "Họa sĩ minh họa 2D", "Quản lý âm nhạc", "Chuyên gia Adobe Illustrator"] },
    ]
  },
  { 
    id: 3, 
    name: "Dịch vụ AI",
    popular: [
      "Lập trình viên OpenAI", "Lập trình viên AI Agent", "Kỹ sư trí tuệ nhân tạo",
      "Kỹ sư Machine Learning", "Nhà khoa học dữ liệu", "Lập trình OpenAI trên AWS",
      "Chuyên gia Deep Learning", "Lập trình viên Pandas", "Kỹ sư thị giác máy tính", "Kỹ sư NLP"
    ],
    subCategories: [
      { name: "Framework & Tools", tags: ["Lập trình viên TensorFlow", "Freelancer PyTorch", "Chuyên gia Scikit-Learn", "Lập trình viên OpenCV", "Lập trình viên thuật toán"] },
      { name: "Chuyên sâu", tags: ["Freelancer Keras", "Chuyên gia Jupyter", "Lập trình Deep Neural Networks", "Chuyên gia phân tích dự đoán", "Freelancer phân tích chuỗi thời gian"] },
    ]
  },
  { 
    id: 4, 
    name: "Bán hàng & Marketing",
    popular: [
      "Phân tích viên Sales", "Tư vấn Marketing thương hiệu", "Tư vấn phân tích Marketing",
      "Chuyên gia mạng xã hội", "Chuyên viên mạng xã hội", "Chuyên viên SEM",
      "Tư vấn Marketing", "Quản lý SEO", "Tư vấn Marketing doanh nghiệp nhỏ", "Tư vấn chiến lược Marketing"
    ],
    subCategories: [
      { name: "Tư vấn chuyên ngành", tags: ["Tư vấn Marketing luật", "Tư vấn Marketing y tế", "Tư vấn Marketing Google", "Tư vấn chiến lược Digital Marketing", "Tư vấn Marketing nha khoa"] },
      { name: "Digital Marketing", tags: ["Tư vấn Marketing doanh nghiệp", "Marketer theo ngành dọc", "Digital Marketer", "Chuyên gia tạo khách hàng tiềm năng", "Marketer tạo nhu cầu"] },
    ]
  },
  { 
    id: 5, 
    name: "Viết lách & Dịch thuật",
    popular: [
      "Người đánh giá sách", "Nhà văn", "Chuyên gia bản tin",
      "Chuyên gia bản thảo", "Nhà văn tạp chí", "Viết CV",
      "Viết nội dung", "Viết kế hoạch kinh doanh", "Nhà văn chuyên nghiệp", "Biên dịch viên"
    ],
    subCategories: [
      { name: "Dịch thuật", tags: ["Chuyên gia dịch tài liệu", "Dịch bài viết", "Dịch sách", "Viết luận văn", "Copywriter"] },
      { name: "Viết chuyên ngành", tags: ["Nhà văn khoa học viễn tưởng", "Viết về ẩm thực", "Biên tập viên", "Freelancer ngữ pháp", "Nhà văn Anime"] },
    ]
  },
  { 
    id: 6, 
    name: "Hành chính & Hỗ trợ",
    popular: [
      "Trợ lý ảo Amazon", "Lập trình viên hệ thống", "Trợ lý ảo Ebay",
      "Chuyên viên nhập liệu", "Chuyên viên mã hóa dữ liệu", "Trợ lý ảo nhập liệu CRM",
      "Trợ lý nhập liệu CRM", "Nhân viên nhập liệu", "Trợ lý ảo", "Dịch vụ thanh toán y tế Medical Mastermind"
    ],
    subCategories: [
      { name: "Quản trị", tags: ["Lập trình Google Calendar", "Trợ lý biên tập", "Chuyên gia phần mềm đấu giá", "Trợ lý ảo bất động sản", "Chuyên gia Excel"] },
      { name: "Hỗ trợ", tags: ["Đại diện chăm sóc khách hàng", "Trợ lý cá nhân", "Quản lý dự án kinh doanh", "Quản lý dự án", "Quản trị viên Microsoft 365 Enterprise"] },
    ]
  },
  { 
    id: 7, 
    name: "Tài chính & Kế toán",
    popular: [
      "Tư vấn phần mềm kế toán", "Quản lý đầu tư", "Quản lý quỹ đầu cơ",
      "Tư vấn kế toán", "Tư vấn CNTT", "Tư vấn tài chính",
      "Kế toán viên", "Tư vấn thuế", "Gia sư kế toán", "Tư vấn giáo dục"
    ],
    subCategories: [
      { name: "Tư vấn & Phân tích", tags: ["Tư vấn quản lý", "Chuyên viên đối chiếu ngân hàng", "Phân tích viên kinh doanh", "Freelancer kỹ năng giao tiếp", "Phân tích viên tài chính"] },
      { name: "Kế toán chuyên môn", tags: ["Đại diện phát triển kinh doanh", "Tư vấn QuickBooks", "Chuyên gia Xero", "Chuyên viên đối chiếu tài khoản", "Chuyên viên lương"] },
    ]
  },
  { 
    id: 8, 
    name: "Pháp lý",
    popular: [
      "Soạn thảo hợp đồng", "Chuyên viên tuân thủ CNTT", "Chuyên viên tuân thủ",
      "Luật sư hợp đồng", "Trợ lý pháp lý", "Nghiên cứu viên pháp lý",
      "Trợ lý luật sư", "Tư vấn pháp lý", "Người đánh giá tài liệu", "Luật sư tài chính chứng khoán"
    ],
    subCategories: [
      { name: "Luật chuyên ngành", tags: ["Luật sư doanh nghiệp", "Freelancer luật kinh doanh", "Luật sư di trú", "Freelancer tuân thủ quy định", "Luật sư bản quyền"] },
      { name: "Tố tụng & Lao động", tags: ["Luật sư sở hữu trí tuệ", "Luật sư dân sự", "Luật sư lao động", "Chuyên gia tố tụng", "Luật sư hình sự"] },
    ]
  },
  { 
    id: 9, 
    name: "Nhân sự & Đào tạo",
    popular: [
      "Quản lý tuyển dụng", "Nhà tuyển dụng", "Freelancer công nghệ",
      "Quản lý nhân sự", "Chuyên gia quản lý nhân tài", "Chuyên gia đào tạo & phát triển",
      "Nhà tuyển dụng LinkedIn", "Thiết kế hướng dẫn", "Phỏng vấn viên", "Chuyên gia e-Learning"
    ],
    subCategories: [
      { name: "Phát triển nhân sự", tags: ["Chuyên gia phát triển lãnh đạo", "Chuyên gia onboarding", "Freelancer tìm nguồn ứng viên", "Phát triển chương trình đào tạo", "Nhà tuyển dụng kỹ thuật"] },
      { name: "Tư vấn HR", tags: ["Chuyên gia hệ thống quản lý học tập (LMS)", "Tư vấn phát triển tổ chức", "Freelancer thiết kế chương trình", "Tư vấn HR", "Chuyên gia gắn kết nhân viên"] },
    ]
  },
  { 
    id: 10, 
    name: "Kỹ thuật & Kiến trúc",
    popular: [
      "Họa sĩ minh họa kiến trúc", "Kỹ sư thiết kế", "Chuyên gia AutoCAD",
      "Chuyên gia Arduino", "Chuyên gia MATLAB", "Kỹ sư chuyên nghiệp",
      "Kỹ sư tư vấn điện", "Kỹ sư Arduino", "Kỹ sư phần cứng", "Kỹ sư chiếu sáng"
    ],
    subCategories: [
      { name: "Kỹ sư chuyên ngành", tags: ["Kỹ sư nông nghiệp", "Kỹ sư hàng không vũ trụ", "Kỹ sư địa kỹ thuật", "Họa sĩ 3D", "Tư vấn kỹ thuật"] },
      { name: "Thiết kế & CAD", tags: ["Thiết kế sản phẩm", "Tư vấn AutoCAD", "Tư vấn an toàn", "Người dựng mô hình 3D", "Thiết kế CAD"] },
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
  { id: 1, name: "Phát triển & CNTT", jobs: 7938, iconType: "dev" },
  { id: 2, name: "Thiết kế & Sáng tạo", jobs: 5640, iconType: "design" },
  { id: 3, name: "Dịch vụ AI", jobs: 2005, iconType: "ai" },
  { id: 4, name: "Bán hàng & Marketing", jobs: 2465, iconType: "marketing" },
  { id: 5, name: "Viết lách & Dịch thuật", jobs: 1892, iconType: "writing" },
  { id: 6, name: "Hành chính & Hỗ trợ", jobs: 1283, iconType: "admin" },
  { id: 7, name: "Tài chính & Kế toán", jobs: 4572, iconType: "finance" },
  { id: 8, name: "Pháp lý", jobs: 343, iconType: "legal" },
  { id: 9, name: "Nhân sự & Đào tạo", jobs: 1456, iconType: "hr" },
  { id: 10, name: "Kỹ thuật & Kiến trúc", jobs: 2134, iconType: "engineering" },
];

export const partners: Partner[] = [
  { id: 1, name: "Partner 1", logo: "/1-sao.png" },
  { id: 2, name: "Partner 2", logo: "/2-sao.png" },
  { id: 3, name: "Partner 3", logo: "/3-sao.png" },
  { id: 4, name: "WorkHub", logo: "/logo.svg" },
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
