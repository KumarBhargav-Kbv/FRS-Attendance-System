# FRS Attendance System — Task Tracker

## Phase 1: Scaffolding & Configuration
- [x] Frontend (Vite + React + Tailwind)
- [x] Backend (Node.js + Express)
- [x] AI Service (Python + FastAPI)
- [x] README.md

## Phase 2: Database Models + Seed
- [x] All Mongoose models (User, Student, Faculty, Department, Subject, Class, Attendance, AttendanceSession, AuditLog, Settings)
- [x] Seed script with SVIET CSE-AIML timetable dataset

## Phase 3: Backend API Routes
- [x] Auth routes (login, register, me)
- [x] Student routes (CRUD + face registration)
- [x] Faculty routes (CRUD)
- [x] Department routes
- [x] Subject routes
- [x] Class routes
- [x] Attendance routes (session, mark, history)
- [x] Report routes (daily, monthly, CSV, PDF)
- [x] Analytics routes
- [x] Audit log routes
- [x] Settings routes
- [x] Middleware (auth, validation, error handling)

## Phase 4: Python AI Service
- [x] FastAPI main app
- [x] Face detection engine
- [x] Face encoding engine
- [x] Face recognition/matching
- [x] Pydantic schemas
- [x] Image utilities

## Phase 5: Frontend Core
- [x] Auth context + hooks
- [x] API service layer
- [x] Protected routes
- [x] Utility helpers

## Phase 6: Layouts & Shared UI
- [x] Admin layout + sidebar
- [x] Faculty layout + sidebar
- [x] Student layout + sidebar
- [x] Shared UI components (StatCard, DataTable, Modal, etc.)

## Phase 7: All Pages
- [x] Landing page
- [x] Login page
- [x] Admin pages (Dashboard, Students, Faculty, Departments, Subjects, Classes, FaceRegistration, Attendance, Reports, Analytics, AuditLogs, Settings)
- [x] Faculty pages (Dashboard, MyClasses, StartAttendance, LiveAttendance, AttendanceHistory, Reports, Profile)
- [x] Student pages (Dashboard, Profile, MyAttendance, SubjectAttendance, AttendanceHistory, Reports)

## Phase 8: Camera & Face Recognition UI
- [x] WebcamCapture component (Inline canvas/video capturing inside FaceRegistration)
- [x] FaceRecognitionFeed component (Inline live video scanning inside LiveAttendance)
- [x] App.jsx routing mapped
