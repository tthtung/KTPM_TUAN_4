# Kiến trúc Backend (Course Materials CMS)

## 1) Backend đang theo kiến trúc gì?
Backend của dự án đang áp dụng kết hợp:

1. **Layered Architecture (kiến trúc phân tầng)**
- Tách rõ các tầng: **Routes/Controllers → Services → Repositories → Infrastructure**.
- Luồng xử lý chuẩn: HTTP request đi vào router → gọi service xử lý nghiệp vụ → service dùng repo để đọc/ghi dữ liệu → repo dùng lớp hạ tầng (JSON store / filesystem).

2. **Microkernel (plug-in) nhẹ theo module**
- Có “core” dùng chung (store init, error handling, auth middleware) + các **module** độc lập tương đối: `auth`, `courses`, `lectures`, `attachments`, `users`.
- Mỗi module tự đóng gói routes/service/repo của nó.

> Vì project là scope môn học + demo nhanh, phần “microkernel” ở đây là kiểu **modular monolith** (1 backend deploy) chứ không phải microservices.

---

## 2) Mapping kiến trúc vào code (đúng theo dự án)

### 2.1 Tầng Routes (API layer)
- Nhiệm vụ: định nghĩa endpoint, parse input, gọi service/repo phù hợp, trả response.
- Ví dụ file:
  - `src/modules/auth/authRoutes.js`
  - `src/modules/lectures/lectureRoutes.js`
  - `src/modules/attachments/attachmentRoutes.js`
  - `src/modules/courses/courseRoutes.js`
  - `src/modules/users/userRoutes.js`

### 2.2 Tầng Services (Application/Business)
- Nhiệm vụ: quy tắc nghiệp vụ (workflow `draft/pending/published`, validate tồn tại lecture khi upload attachment, lọc/search).
- Ví dụ file:
  - `src/modules/auth/authService.js` (login + JWT)
  - `src/modules/lectures/lectureService.js` (list/filter/get/create/update/remove)
  - `src/modules/attachments/attachmentService.js` (create/remove + download path)

### 2.3 Tầng Repositories (Data access)
- Nhiệm vụ: thao tác dữ liệu (CRUD) với cấu trúc lưu trữ.
- Ví dụ file:
  - `src/modules/lectures/lectureRepo.js`
  - `src/modules/attachments/attachmentRepo.js`
  - `src/modules/courses/courseRepo.js`
  - `src/modules/users/userRepo.js`

### 2.4 Tầng Infrastructure (hạ tầng)
- Nhiệm vụ: chi tiết kỹ thuật: đọc/ghi JSON, quản lý file uploads, middleware dùng chung.
- Ví dụ file:
  - `src/core/jsonStore.js` (đọc/ghi `data/db.json` + write queue)
  - `uploads/` (lưu file)
  - `src/modules/auth/authMiddleware.js` (gắn `req.user`, check role)
  - `src/app.js` (wiring DI thủ công + mount router + error handler)
  - `src/seed.js` (seed user/course demo)

---

## 3) Luồng nghiệp vụ mẫu

### 3.1 Public xem bài giảng
1. UI gọi `GET /api/public/lectures` (có thể kèm `q/week/courseId`)
2. Router gọi service listPublicFiltered
3. Service gọi repo listPublic (chỉ `status=published`)
4. Repo đọc JSON store, trả dữ liệu

### 3.2 Admin/Editor tạo bài giảng
1. UI login lấy JWT (`POST /api/auth/login`)
2. UI gọi `POST /api/lectures` kèm header `Authorization: Bearer <token>`
3. Middleware decode JWT + check role
4. Router parse payload → Service → Repo → JSON store

### 3.3 Upload file đính kèm
1. UI gọi `POST /api/lectures/:lectureId/attachments` (multipart `file`)
2. Multer lưu file vào `uploads/`
3. Service tạo metadata attachment và lưu vào JSON store

---

## 4) Ưu điểm

- **Dễ trình bày & đúng môn Kiến trúc**: phân tầng rõ ràng, giải thích được trách nhiệm từng tầng.
- **Dễ mở rộng chức năng**: thêm module mới (ví dụ: `search`, `comments`) mà không phá core.
- **Dễ bảo trì**: đổi cách lưu trữ (JSON → DB thật) chủ yếu ảnh hưởng repo/infrastructure, ít ảnh hưởng UI & routes.
- **Test logic đơn giản**: service/repo tách riêng, dễ mock store.
- **Triển khai nhanh**: hợp demo bài tập; không cần cài DB.

---

## 5) Nhược điểm / giới hạn

- **JSON store không phù hợp production**:
  - Đồng thời nhiều người dùng sẽ dễ xung đột/giảm hiệu năng.
  - Không có index/query tối ưu như DB.
  - Không có ràng buộc dữ liệu (foreign key), dễ sai lệch nếu code lỗi.

- **Microkernel “nhẹ” nên chưa đúng plug-in runtime**:
  - Các module không load/unload động như plugin system thực sự.
  - Vẫn là monolith; deploy chung.

- **Auth/role là MVP**:
  - JWT secret đang có default cho dev; production cần env + rotation.
  - Thiếu refresh token, revoke token, audit log.

- **Workflow chỉ là trạng thái**:
  - Chưa có luồng “editor submit → admin approve” tách quyền và lịch sử duyệt.

---

## 6) Hướng nâng cấp (nếu cần mở rộng báo cáo)
- Thay `JsonStore` bằng DB thật (PostgreSQL/MySQL/MongoDB) + migration.
- Thêm bảng `approvalHistory`/`auditLogs` để mô tả quy trình duyệt.
- Chuẩn hoá quyền theo capability (RBAC chi tiết hơn) + refresh token.
- Tách module theo “bounded context” nếu scale lớn (nhưng vẫn có thể là modular monolith).
