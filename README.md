# VANGUARD - Website Bán Giày

Hệ thống thương mại điện tử bán giày xây dựng bằng Next.js + Spring Boot + PostgreSQL.

## Công nghệ sử dụng
- **Frontend:** Next.js 16, TypeScript, Tailwind CSS, Zustand, Framer Motion
- **Backend:** Java 17, Spring Boot 3.2.5, Spring Security, JWT
- **Database & Cache:** PostgreSQL 15, Redis 7 (Caching & Distributed Rate Limiting)
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
- **Redis Cache:** localhost:6379

### 3. Dừng hệ thống
```bash
stop.bat
# hoặc
docker-compose down
```

## Cách chạy dự án cục bộ (Local không dùng Docker)
1. Khởi động PostgreSQL (port 5433 hoặc 5432) và Redis (port 6379).
2. Import file database `database_full.sql` vào cơ sở dữ liệu `shoesshop`.
3. Trên Windows: Chạy file `run_local.bat` để tự động khởi chạy Backend và Frontend trong 2 cửa sổ cmd riêng.
4. Hoặc chạy thủ công qua Terminal:
   - **Backend:** `cd backend && mvn spring-boot:run`
   - **Frontend:** `cd frontend && npm run dev`

## Cấu trúc thư mục
- `/frontend`: Mã nguồn Next.js (Giao diện người dùng & Admin)
- `/backend`: Mã nguồn Spring Boot (API & Logic xử lý)
- `database_full.sql`: Toàn bộ script khởi tạo bảng, quan hệ và trigger database
- `database_schema.dbml`: Thiết kế lược đồ cơ sở dữ liệu DBML
- `docker-compose.yml`: Cấu hình Docker Compose cho toàn bộ hệ thống
- `start.bat` / `stop.bat`: Script khởi động và dừng Docker trên Windows
- `run_local.bat`: Script chạy trực tiếp backend và frontend cục bộ trên Windows
