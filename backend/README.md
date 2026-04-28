---

# Leave Management API (MERN Backend)

**Version**: 1.0.0  
A robust, production-ready backend for managing employee leave requests. Built with **Node.js, Express 5, MongoDB (Mongoose 9.x), JWT authentication, and role-based access control**.

---

## 🔑 Key Features
- Secure JWT authentication with role-based access (`admin` / `employee`)
- Expanded **User model**:
  - `name`, `lastName`, `department`, `position`, `contact`, `email`, `role`, `leaveBalance`
  - Soft-delete (`isDeleted`, `deletedAt`) and trash (`isTrashed`, `trashedAt`)
- Expanded **Leave model**:
  - `employeeName`, `employeeLastName`, `leaveType`, `startDate`, `endDate`, `duration`, `reason`, `status`
  - Soft-delete (`isDeleted`, `deletedAt`) and trash (`isTrashed`, `trashedAt`)
- Employee leave request creation, viewing, cancellation
- Admin dashboard: user management, leave approvals, soft-delete/restore/trash
- Automatic leave balance deduction on approval
- Strong password policy, input validation (Joi), secure headers (Helmet), and CORS
- Interactive Swagger documentation (OpenAPI 3.0)
- Consistent API response format (`success`, `statusCode`, `message`)
- One-command admin seeding

---

## 🛠️ Tech Stack
- **Runtime**: Node.js  
- **Framework**: Express.js v5  
- **Database**: MongoDB + Mongoose ODM (v9.3+)  
- **Auth**: JSON Web Tokens (jsonwebtoken)  
- **Validation**: Joi  
- **Security**: Helmet, bcryptjs  
- **Docs**: Swagger-jsdoc + Swagger UI Express + YAML config  
- **Dev Tools**: Nodemon, ESLint, Prettier  

---

## 📂 Project Structure
```bash
leave-management-backend/
├── scripts/
│   └── seedAdmin.js
├── src/
│   ├── config/
│   │   ├── database.js
│   │   ├── swagger.js
│   │   └── swagger.yaml
│   ├── controllers/
│   │   ├── admin.controller.js
│   │   ├── auth.controller.js
│   │   └── employee.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   ├── role.middleware.js
│   │   └── validate.middleware.js
│   ├── models/
│   │   ├── Leave.model.js
│   │   └── User.model.js
│   ├── routes/
│   │   ├── admin.routes.js
│   │   ├── auth.routes.js
│   │   └── employee.routes.js
│   ├── utils/
│   │   └── leaveUtils.js
│   └── validators/
│       ├── auth.validator.js
│       ├── leave.validator.js
│       └── user.validator.js
├── .env
├── .env.example
├── package.json
├── server.js
└── README.md
```

---

## ⚙️ Setup & Installation
```bash
git clone <your-repo-url>
cd leave-management-backend
npm install
cp .env.example .env
```

Edit `.env`:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER>.mongodb.net/LeaveManagement
JWT_SECRET=super-secure-secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
SWAGGER_SERVER_URL=http://localhost:5000/api/v1
```

Seed default admin:
```bash
npm run seed:admin
```

Run server:
```bash
npm run dev   # development
npm start     # production
```

---

## 📌 API Endpoints

### Auth
- `POST /auth/login` → Login user  
- `GET /auth/me` → Get current user profile  
- `POST /auth/change-password` → Change password  

### Employee
- `GET /employee/employees/{id}` → Get employee by ID  
- `GET /employee/leaves/my` → Get logged-in employee leave history  
- `POST /employee/leaves` → Create leave request  
- `PATCH /employee/leaves/{id}/cancel` → Cancel leave request  

### Admin
- `POST /admin/users` → Create new user  
- `GET /admin/employees` → Get all employees  
- `GET /admin/stats` → Get admin statistics  
- `PATCH /admin/employees/{id}` → Update employee details 
- `PATCH /admin/employees/{id}/remove` → Soft delete employee  
- `PATCH /admin/employees/{id}/restore` → Restore employee  
- `DELETE /admin/employees/{id}/permanent` → Permanently delete employee  
- `GET /admin/leaves` → Get all leaves  
- `GET /admin/leaves/{id}` → Get leave details by ID  
- `PATCH /admin/leaves/{id}/status` → Update leave status  
- `PATCH /admin/leaves/{id}/soft-delete` → Soft delete leave (`isDeleted` + `deletedAt`)  
- `PATCH /admin/leaves/{id}/restore-soft` → Restore soft-deleted leave  
- `PATCH /admin/leaves/{id}/trash` → Move leave to trash (`isTrashed` + `trashedAt`)  
- `PATCH /admin/leaves/{id}/restore` → Restore trashed leave  
- `DELETE /admin/leaves/{id}/permanent` → Permanently delete leave  

**Additional**:
- `GET /api/v1/health` → Server health check  

---

## 📜 Available Scripts
```bash
npm run dev          # Start with nodemon (recommended)
npm start            # Production start
npm run seed:admin   # Seed default admin
npm run lint         # Run ESLint
npm run format       # Run Prettier
```

---

## 🆕 Recent Changes (April 2026)
- Expanded **User** and **Leave** models with new fields  
- Added soft-delete and trash/restore functionality  
- Strong password policy enforced via Joi  
- Swagger YAML updated with reusable schemas  
- Consistent API responses (`success`, `statusCode`, `message`)  
- Centralized leave day calculation in `leaveUtils.js`  
- Health check endpoint added  

---

## 🔮 Roadmap
- Exclude weekends/holidays from leave day calculation  
- Email notifications (nodemailer)  
- Rate limiting & advanced logging  
- Docker + CI/CD pipeline  
- Analytics & reporting dashboard  

---

## 👨‍💻 Author
**Aljun Dalman**  
Quezon City, Philippines  

---