# Freelancer Platform - Ngành Xây Dựng

## Giới thiệu

Nền tảng Freelancer chuyên biệt cho ngành xây dựng, kết nối các kỹ sư, chuyên gia xây dựng với các dự án thi công. Hệ thống tích hợp công nghệ blockchain để đảm bảo thanh toán an toàn và minh bạch.

## Đặc điểm nổi bật

- **Chuyên ngành xây dựng**: Tập trung vào các lĩnh vực thi công, kỹ thuật, giám sát công trình
- **Thanh toán ký quỹ**: Sử dụng blockchain Aptos để đảm bảo an toàn giao dịch
- **Hợp đồng thông minh**: Tự động hóa quy trình ký kết và thanh toán
- **Hệ thống tranh chấp**: Giải quyết tranh chấp minh bạch với cơ chế bỏ phiếu

## Cấu trúc dự án

```
freelancer-web/
├── client/                    # Frontend - Next.js 14
│   ├── components/            # UI Components
│   │   ├── jobs/            # Job-related components
│   │   ├── layout/          # Layout components
│   │   └── landing/         # Landing page
│   ├── lib/                 # Utility functions
│   ├── pages/               # Next.js pages
│   └── styles/              # Global styles
├── backend/                  # Backend API - Spring Boot
│   ├── src/main/java/        # Java source code
│   │   └── com/workhub/api/ # Main package
│   │       ├── controller/   # REST Controllers
│   │       ├── service/     # Business logic
│   │       ├── repository/   # Data access
│   │       ├── entity/      # Database entities
│   │       └── dto/         # Data transfer objects
│   └── src/main/resources/   # Configuration files
└── contract/                 # Smart Contracts - Move
    └── contract/
        └── job/            # Job-related contracts
            └── sources/     # Move source files
```

## Công nghệ sử dụng

### Frontend

- **Next.js 14** - React framework với App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **React Hook Form** - Form handling
- **Axios** - HTTP client

### Backend

- **Java 17** - Programming language
- **Spring Boot 3.2** - Application framework
- **Spring Security** - Authentication & authorization
- **Spring Data JPA** - Database access
- **PostgreSQL** - Primary database
- **Redis** - Caching & session storage
- **JWT** - Authentication tokens

### Blockchain

- **Aptos** - Blockchain platform
- **Move** - Smart contract language
- **TypeScript SDK** - Blockchain interaction

### Infrastructure

- **Cloudinary** - File storage
- **Gmail SMTP** - Email service
- **ZaloPay** - Payment gateway
- **Upstash Redis** - Managed Redis

## Hướng dẫn cài đặt

### Yêu cầu

- Node.js 18+
- Java 17+
- PostgreSQL 14+
- Redis 6+

### Cài đặt

1. **Clone repository**

   ```bash
   git clone <repository-url>
   cd freelancer-web
   ```

2. **Cài đặt frontend**

   ```bash
   cd client
   npm install
   npm run dev
   ```

3. **Cài đặt backend**

   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

4. **Cấu hình môi trường**
   - Tạo file `.env` với các biến môi trường cần thiết
   - Cấu hình database connection
   - Cấu hình JWT secret
   - Cấu hình blockchain connection

## Các tính năng chính

### Đăng việc & Tìm việc

- Đăng việc theo các lĩnh vực xây dựng
- Tìm kiếm việc theo kỹ năng
- Bộ lọc nâng cao theo ngành nghề

### Quản lý ứng tuyển

- Nộp đơn ứng tuyển
- Duyệt/từ chối ứng viên
- Quản lý danh sách ứng viên

### Hợp đồng & Thanh toán

- Ký hợp đồng điện tử
- Thanh toán ký quỹ an toàn
- Tự động giải ngân khi hoàn thành

### Quản lý công việc

- Theo dõi tiến độ công việc
- Nộp và duyệt sản phẩm
- Yêu cầu sửa đổi (nếu cần)

### Hệ thống tranh chấp

- Tạo khiếu nại khi có vấn đề
- Nộp bằng chứng minh chứng
- Bỏ phiếu giải quyết tranh chấp

### Đánh giá & Uy tín

- Hệ thống đánh giá hai chiều
- Tính điểm uy tín (trust/untrust)
- Lịch sử làm việc


## Smart Contracts

Smart contracts được triển khai trên testnet Aptos tại địa chỉ:

```
0xaacc126cc0150c75aae6e8a8537d8a25ae6b085edf56d7cf1db4eeac92ed5489
```

## Testing

### Frontend Tests

```bash
cd client
npm run test
```

### Backend Tests

```bash
cd backend
./mvnw test
```

## Deployment

### Frontend Deployment

- Build: `npm run build`
- Deploy: Vercel, Netlify, hoặc static hosting

### Backend Deployment

- Build: `./mvnw clean package`
- Deploy: Docker, AWS, hoặc cloud platform

## Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.


