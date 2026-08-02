# VANGUARD - Website Bán Giày

Hệ thống thương mại điện tử bán giày xây dựng bằng Next.js + Spring Boot + PostgreSQL.

## Công nghệ sử dụng
- **Frontend:** Next.js 16, TypeScript, Tailwind CSS, Zustand, Framer Motion
- **Backend:** Java 17, Spring Boot 3.2.5, Spring Security, JWT
- **Database:** PostgreSQL 15
- **Triển khai:** Docker & Docker Compose

## Cách chạy dự án (Docker)

### 1. Cấu hình biến môi trường
Trước khi chạy, bạn cần thiết lập cấu hình an toàn cho hệ thống bằng cách sử dụng các file mẫu:
- **Frontend:** Copy `frontend/.env.example` thành `frontend/.env` và điền key (Gemini, Google OAuth...).
- **Backend:** Copy `backend/src/main/resources/application.example.yml` thành `backend/src/main/resources/application-dev.yml` và điền cấu hình (DB, Mail, Sepay...).

### 2. Khởi chạy hệ thống
Dự án đã được cấu hình sẵn Docker. Mở Terminal ở thư mục gốc và chạy:
```bash
# Trên Windows có thể chạy file start.bat
start.bat

# Hoặc dùng trực tiếp docker-compose
docker-compose up -d --build
```
Hệ thống sẽ chạy tại:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8080

### 3. Dừng hệ thống
```bash
stop.bat
# hoặc
docker-compose down
```

## Cấu trúc thư mục
- `/frontend`: Mã nguồn Next.js (Giao diện người dùng & Admin)
- `/backend`: Mã nguồn Spring Boot (API & Logic xử lý)
- `database_schema.sql` & `populate_recommendations.sql`: Script khởi tạo database
- `docker-compose.yml`: Cấu hình Docker
