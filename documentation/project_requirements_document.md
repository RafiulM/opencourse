# Project Requirements Document: OpenCourse Backend

## 1. Project Overview

OpenCourse is a backend service designed to power an open courses platform. Its core purpose is to manage all course-related data—such as course creation, updates, deletions, and retrieval—while handling user authentication, authorization, and enrollment. By providing a well-defined, versioned RESTful API and a relational database schema managed with Drizzle ORM, OpenCourse ensures that any frontend or client application can integrate seamlessly and that data remains consistent and secure.

We are building this backend to serve as the foundation for web or mobile frontends, partner integrations, or third-party tools that need to interact with course information and user accounts. The key objectives are: 1) reliable CRUD operations on courses and users; 2) secure, role-based access control; 3) clear API documentation; and 4) a maintainable, test-driven codebase. Success will be measured by meeting performance targets (e.g., sub-200ms API responses), achieving at least 80% test coverage, and having zero critical bugs in production during the initial rollout.

## 2. In-Scope vs. Out-of-Scope

**In-Scope (Version 1.0):**
- Course management APIs (Create, Read, Update, Delete courses)
- User management APIs (Registration, Login, Profile updates)
- Role-based authorization (Student, Instructor, Administrator)
- Enrollment endpoints (students enrolling in courses)
- Relational database schema using Drizzle ORM and SQL migrations
- Versioned, RESTful API design (e.g., `/api/v1/courses`, `/api/v1/users`)
- Automated testing suite (unit & integration tests)
- Centralized error handling and structured logging
- Auto-generated API documentation (Swagger/OpenAPI)
- Environment configuration via environment variables

**Out-of-Scope (Planned for Later Phases):**
- Frontend or UI components (web or mobile)
- Video hosting or streaming services
- Payment gateway or subscription billing
- Advanced search and recommendations
- Analytics dashboard and reporting
- Real-time features (chat, notifications)
- Multi-tenant or white-label support
- Internationalization (i18n) beyond basic locale handling

## 3. User Flow

A typical user starts by registering with an email and password, then confirms their account via email if required. Once authenticated, they land on a dashboard endpoint (`GET /api/v1/users/me`) that returns their profile and a summary of their enrolled courses. From there, the user can browse available courses using `GET /api/v1/courses`, view detailed information on a specific course with `GET /api/v1/courses/:id`, and enroll in that course via `POST /api/v1/courses/:id/enroll`.

An instructor or administrator follows a similar journey but with elevated permissions. After login, they can create new courses by sending course metadata to `POST /api/v1/courses`, update existing courses via `PUT /api/v1/courses/:id`, and delete courses using `DELETE /api/v1/courses/:id`. All actions are protected by JWT-based authentication and role checks, ensuring that only authorized roles can access or modify course data.

## 4. Core Features

- **Authentication & Authorization**: JWT-based login, password hashing, role checks (student, instructor, admin).
- **Course CRUD**: API endpoints for creating, reading, updating, and deleting courses.
- **User Management**: Registration, login, profile update, password reset.
- **Enrollment**: Endpoints to enroll and unenroll a student from a course.
- **RESTful API**: Versioned routes, consistent request/response formats, error codes.
- **Relational Database**: Schema defined in Drizzle ORM, migrations in SQL files.
- **Automated Testing**: Jest-based unit and integration tests covering all endpoints.
- **Error Handling & Logging**: Centralized middleware for errors, structured logs via Pino or Winston.
- **API Documentation**: Swagger/OpenAPI spec auto-generated from code annotations.
- **Configuration Management**: Environment variables for secrets, database URLs, etc.

## 5. Tech Stack & Tools

- **Runtime & Language**: Node.js (>=18) with TypeScript for type safety.
- **Web Framework**: Express.js or Fastify for building RESTful APIs.
- **ORM & Migrations**: Drizzle ORM with SQL migration files and `drizzle/meta` tracking.
- **Database**: PostgreSQL (primary), fallback to SQLite for local development.
- **Authentication**: JSON Web Tokens (JWT), bcrypt for password hashing.
- **Testing**: Jest with Supertest for HTTP endpoint testing.
- **Logging**: Pino or Winston for structured, leveled logs.
- **Documentation**: Swagger/OpenAPI via `swagger-jsdoc` or similar.
- **Monorepo Tooling**: pnpm or npm workspaces.
- **IDE & Plugins**: VS Code with ESLint, Prettier, and Drizzle ORM extension (optional).

## 6. Non-Functional Requirements

- **Performance**: API response times under 200ms for standard CRUD operations under normal load.
- **Scalability**: Ability to scale horizontally by adding more instances behind a load balancer.
- **Security**: OWASP Top 10 compliance, JWT secrets in env variables, input validation (AJV), rate limiting.
- **Reliability**: 99.9% uptime SLA, health-check endpoints, automatic restarts on failure.
- **Maintainability**: 80%+ code coverage, linting and formatting enforced, modular code structure.
- **Usability**: Clear and consistent API error messages with standard HTTP status codes.

## 7. Constraints & Assumptions

- **Drizzle ORM** is available and compatible with our Node.js version.
- **PostgreSQL** instance is provisioned with network access and correct credentials.
- The service will run in a containerized environment (Docker), requiring a Dockerfile.
- Environment variables will be managed externally (e.g., Kubernetes secrets or `.env`).
- Monorepo structure will only contain this backend for version 1.0.
- No third-party video or payment services are integrated in this phase.

## 8. Known Issues & Potential Pitfalls

- **Migration Conflicts**: Concurrent migrations can conflict if not serialized—use CI checks to prevent overlapping.
- **ORM Limitations**: Drizzle’s API may lack some advanced query features—fallback to raw SQL when needed.
- **Token Revocation**: JWT revocation is stateless by default—consider a token blacklist store for manual invalidation.
- **Rate Limiting**: Without a rate limiter, brute-force login attacks are possible—implement `express-rate-limit`.
- **Database Indexing**: Missing indexes on foreign keys or search columns will degrade performance—add indexes in migrations.
- **Logging Volume**: Excessive log verbosity can bloat storage—use log levels and external log aggregation.


*This document is the single source of truth for the OpenCourse backend. All subsequent documents—Tech Stack, API Spec, Frontend Guidelines, and Deployment Plans—should reference these requirements directly.*