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

export const jobCategories: JobCategory[] = [
  { 
    id: 1, 
    name: "Kinh doanh/Bán hàng",
    popular: ["Nhân viên kinh doanh", "Nhân viên bán hàng", "Nhân viên tư vấn", "Telesales", "Sales Admin", "Tư vấn tuyển sinh", "Sales Online"],
    subCategories: [
      { name: "Sales Xuất nhập khẩu/Logistics", tags: ["Sales Logistics", "Sales Xuất nhập khẩu/Logistics khác"] },
      { name: "Sales Bất động sản", tags: ["Sales bất động sản/Môi giới bất động sản", "Sales Bất động sản khác"] },
      { name: "Sales Xây dựng", tags: ["Kinh doanh thiết bị/vật liệu xây dựng", "Kinh doanh nội thất", "Tư vấn thiết kế xây dựng", "Sales Xây dựng khác"] },
    ]
  },
  { 
    id: 2, 
    name: "Marketing/PR/Quảng cáo",
    popular: ["Marketing", "Digital Marketing", "Content Marketing", "SEO", "Graphic Design"],
    subCategories: [
      { name: "Marketing Online", tags: ["Facebook Ads", "Google Ads", "TikTok Marketing"] },
      { name: "Content", tags: ["Content Writer", "Copywriter", "Content Creator"] },
    ]
  },
  { 
    id: 3, 
    name: "Chăm sóc khách hàng (Customer Service)",
    popular: ["Chăm sóc khách hàng", "Tổng đài viên", "CSKH Online"],
    subCategories: []
  },
  { 
    id: 4, 
    name: "Nhân sự/Hành chính/Pháp chế",
    popular: ["Nhân sự", "Hành chính", "Thư ký", "Lễ tân"],
    subCategories: []
  },
  { 
    id: 5, 
    name: "Công nghệ Thông tin",
    popular: ["Developer", "Tester", "BA", "DevOps", "AI Engineer"],
    subCategories: [
      { name: "Lập trình", tags: ["Frontend", "Backend", "Fullstack", "Mobile Dev"] },
      { name: "Quản lý", tags: ["Project Manager", "Product Manager", "Scrum Master"] },
    ]
  },
  { 
    id: 6, 
    name: "Lao động phổ thông",
    popular: ["Công nhân", "Bảo vệ", "Lái xe", "Giao hàng"],
    subCategories: []
  },
  { 
    id: 7, 
    name: "Tài chính/Kế toán",
    popular: ["Kế toán", "Kiểm toán", "Tài chính", "Ngân hàng"],
    subCategories: []
  },
  { 
    id: 8, 
    name: "Thiết kế/Đồ họa",
    popular: ["Graphic Designer", "UI/UX Designer", "3D Designer"],
    subCategories: []
  },
  { 
    id: 9, 
    name: "Giáo dục/Đào tạo",
    popular: ["Giáo viên", "Gia sư", "Đào tạo viên"],
    subCategories: []
  },
  { 
    id: 10, 
    name: "Y tế/Dược phẩm",
    popular: ["Bác sĩ", "Y tá", "Dược sĩ", "Trình dược viên"],
    subCategories: []
  },
  { 
    id: 11, 
    name: "Xây dựng/Kiến trúc",
    popular: ["Kỹ sư xây dựng", "Kiến trúc sư", "Giám sát"],
    subCategories: []
  },
  { 
    id: 12, 
    name: "Logistics/Vận tải",
    popular: ["Logistics", "Xuất nhập khẩu", "Kho vận"],
    subCategories: []
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
    number: "540.000+", 
    title: "Nhà tuyển dụng uy tín",
    desc: "Các nhà tuyển dụng đến từ tất cả các ngành nghề và được xác thực"
  },
  { 
    number: "200.000+", 
    title: "Doanh nghiệp hàng đầu",
    desc: "Samsung, Viettel, Vingroup, FPT, Techcombank,..."
  },
  { 
    number: "2.000.000+", 
    title: "Việc làm đã được kết nối",
    desc: "Kết nối ứng viên với cơ hội việc làm từ doanh nghiệp uy tín"
  },
  { 
    number: "1.200.000+", 
    title: "Lượt tải ứng dụng",
    desc: "60% là ứng viên có kinh nghiệm từ 3 năm trở lên"
  },
];
