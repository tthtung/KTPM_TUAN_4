# CMS Tài liệu môn học (UI + Backend)

## Chức năng
- Bài giảng theo Tuần/Chương
- Workflow trạng thái: `draft` → `pending` → `published`
- File đính kèm: upload / tải xuống / xoá
- Môn học (Course) và bài giảng thuộc môn
- Tìm kiếm/lọc theo `q`, `week`, `courseId`, `status`
- Đăng nhập + phân quyền (JWT): Admin/Editor quản trị; Public xem bài published

## Tài khoản demo
- `admin` / `admin123`
- `editor` / `editor123`
- `student` / `student123` (không có quyền quản trị)

## Chạy dự án

### 1) Backend (Express)
```bash
cd backend
npm install
npm run dev
```
Backend: http://localhost:3001

### 2) Frontend (Vite + React)
```bash
cd frontend
npm install
npm run dev
```
Frontend: http://localhost:5173

## API chính
- `POST /api/auth/login`
- `GET /api/courses`
- `GET /api/public/lectures`
- `GET /api/public/lectures/:id`
- `GET /api/lectures`
- `POST /api/lectures`
- `PUT /api/lectures/:id`
- `DELETE /api/lectures/:id`
- `POST /api/lectures/:lectureId/attachments` (form-data field: `file`)
- `GET /api/attachments/:id/download`
- `DELETE /api/attachments/:id`

## Ghi chú
- Các endpoint quản trị yêu cầu header `Authorization: Bearer <token>` (login để lấy token).

## Kiến trúc (Layer + Microkernel nhẹ)
- Layer: Routes/Controllers → Services → Repositories(JSON Store)
- Microkernel: Core (store, error handling) + modules (lectures, attachments)
