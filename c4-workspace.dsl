workspace "CMS Tài liệu môn học" "Hệ thống quản trị tài liệu môn học: bài giảng theo tuần/chương, workflow draft/pending/published, file đính kèm, đăng nhập/phân quyền." {

    !identifiers hierarchical

    model {
        student = person "Student" "Xem tài liệu/bài giảng công khai."
        lecturer = person "Lecturer/Editor" "Tạo/sửa bài giảng, upload file đính kèm, bật/tắt công khai."
        admin = person "Admin" "Quản trị toàn bộ nội dung."

        cms = softwareSystem "Course Materials CMS" "Quản lý môn học, bài giảng, file đính kèm và workflow xuất bản." {
            web = container "Web UI" "Single-page web application cho Public/Admin." "React + Vite" {
                tags "Web"

                pubPages = component "Public Pages" "Danh sách & xem bài giảng published." "React Pages"
                adminPages = component "Admin Pages" "Quản trị bài giảng (CRUD, lọc, publish/unpublish, upload file)." "React Pages"
                loginPage = component "Login Page" "Đăng nhập để lấy JWT." "React Page"
                apiClient = component "API Client" "Gọi Backend API, gắn Bearer token." "fetch wrapper"
                authStore = component "Auth Store" "Lưu token/user trong localStorage." "localStorage"
            }

            api = container "Backend API" "Cung cấp API: auth, courses, lectures, attachments, users." "Node.js + Express" {
                tags "API"

                // Level 3 (coarse components)
                routes = component "HTTP Routes" "Express routers cho auth/courses/lectures/attachments/users." "Express Router"
                services = component "Application Services" "Xử lý nghiệp vụ: login, workflow, upload." "Services"
                repos = component "Repositories" "Truy cập dữ liệu dạng JSON (db.json)." "Repositories"
                fileIO = component "File Storage" "Lưu/đọc file upload trong uploads/." "Filesystem"

                // Level 4 (detailed code-ish components)
                authRoutes = component "authRoutes" "POST /auth/login" "src/modules/auth/authRoutes.js"
                lectureRoutes = component "lectureRoutes" "CRUD & public lecture endpoints" "src/modules/lectures/lectureRoutes.js"
                attachmentRoutes = component "attachmentRoutes" "Upload/download/delete attachments" "src/modules/attachments/attachmentRoutes.js"
                courseRoutes = component "courseRoutes" "List/create courses" "src/modules/courses/courseRoutes.js"
                userRoutes = component "userRoutes" "List/create users (admin)" "src/modules/users/userRoutes.js"

                authService = component "AuthService" "Login + JWT" "src/modules/auth/authService.js"
                lectureService = component "LectureService" "List/filter/get/create/update/remove lectures" "src/modules/lectures/lectureService.js"
                attachmentService = component "AttachmentService" "Create/remove attachments + download path" "src/modules/attachments/attachmentService.js"

                userRepo = component "UserRepo" "Persist users" "src/modules/users/userRepo.js"
                lectureRepo = component "LectureRepo" "Persist lectures + workflow status" "src/modules/lectures/lectureRepo.js"
                attachmentRepo = component "AttachmentRepo" "Persist attachments" "src/modules/attachments/attachmentRepo.js"
                courseRepo = component "CourseRepo" "Persist courses" "src/modules/courses/courseRepo.js"

                jsonStore = component "JsonStore" "Read/write db.json" "src/core/jsonStore.js"
                authMw = component "Auth Middleware" "Parse Bearer token, enforce roles" "src/modules/auth/authMiddleware.js"
                seed = component "Seed" "Seed demo users/courses" "src/seed.js"
            }

            db = container "Data Store" "Lưu metadata bài giảng và metadata file đính kèm." "JSON file (db.json)" {
                tags "Database"
            }

            fs = container "File Store" "Lưu nội dung file đính kèm (upload/download)." "Local folder (uploads/)" {
                tags "FileStore"
            }
        }

        student -> cms.web "Views public lectures"
        lecturer -> cms.web "Manages lectures & attachments"
        admin -> cms.web "Administers content"

        cms.web -> cms.api "Calls API"
        cms.api -> cms.db "Reads/Writes"
        cms.api -> cms.fs "Stores/Reads files"

        // Container -> component relationships (Level 3)
        cms.web.apiClient -> cms.api.routes "Calls"
        cms.web.loginPage -> cms.web.apiClient "Uses"
        cms.web.adminPages -> cms.web.apiClient "Uses"
        cms.web.pubPages -> cms.web.apiClient "Uses"
        cms.web.apiClient -> cms.web.authStore "Reads token"

        cms.api.routes -> cms.api.authMw "Applies auth/role guards"
        cms.api.routes -> cms.api.services "Invokes"
        cms.api.services -> cms.api.repos "Uses"
        cms.api.services -> cms.api.fileIO "Reads/Writes"
        cms.api.repos -> cms.api.jsonStore "Persists"

        cms.api.jsonStore -> cms.db "Reads/Writes"
        cms.api.fileIO -> cms.fs "Reads/Writes"

        // Detailed code-ish relationships (Level 4)
        cms.api.authRoutes -> cms.api.authService "Calls"
        cms.api.lectureRoutes -> cms.api.lectureService "Calls"
        cms.api.attachmentRoutes -> cms.api.attachmentService "Calls"
        cms.api.courseRoutes -> cms.api.courseRepo "Uses"
        cms.api.userRoutes -> cms.api.userRepo "Uses"

        cms.api.authService -> cms.api.userRepo "Reads users"
        cms.api.lectureService -> cms.api.lectureRepo "Reads/Writes lectures"
        cms.api.lectureService -> cms.api.attachmentService "Lists attachments"
        cms.api.attachmentService -> cms.api.attachmentRepo "Reads/Writes attachments"
        cms.api.attachmentService -> cms.api.lectureRepo "Validates lecture"

        cms.api.userRepo -> cms.api.jsonStore "Reads/Writes"
        cms.api.lectureRepo -> cms.api.jsonStore "Reads/Writes"
        cms.api.attachmentRepo -> cms.api.jsonStore "Reads/Writes"
        cms.api.courseRepo -> cms.api.jsonStore "Reads/Writes"
    }

    views {
        systemContext cms "C4_L1_SystemContext" {
            include *
            autolayout lr
        }

        container cms "C4_L2_Container" {
            include *
            autolayout lr
        }

        // Level 3: Component diagrams
        component cms.api "C4_L3_Component_Backend" {
            include cms.api.routes
            include cms.api.services
            include cms.api.repos
            include cms.api.fileIO
            include cms.api.jsonStore
            include cms.db
            include cms.fs
            include *
            autolayout lr
        }

        component cms.web "C4_L3_Component_WebUI" {
            include *
            autolayout lr
        }

        // Level 4: Detailed (code-level) component views
        component cms.api "C4_L4_Code_Backend" {
            include cms.api.authRoutes
            include cms.api.lectureRoutes
            include cms.api.attachmentRoutes
            include cms.api.courseRoutes
            include cms.api.userRoutes

            include cms.api.authService
            include cms.api.lectureService
            include cms.api.attachmentService

            include cms.api.userRepo
            include cms.api.lectureRepo
            include cms.api.attachmentRepo
            include cms.api.courseRepo

            include cms.api.jsonStore
            include cms.api.authMw
            include cms.api.seed
            include cms.db
            include cms.fs

            autolayout lr
        }

        styles {
            element "Element" {
                color #f88728
                stroke #f88728
                strokeWidth 7
                shape roundedbox
            }

            element "Person" {
                shape person
            }

            element "Database" {
                shape cylinder
            }

            element "FileStore" {
                shape folder
            }

            element "Web" {
                shape webBrowser
            }

            element "API" {
                shape roundedbox
            }

            element "Boundary" {
                strokeWidth 5
            }

            relationship "Relationship" {
                thickness 4
            }
        }
    }

    configuration {
        scope softwaresystem
    }

}
