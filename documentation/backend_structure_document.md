# Backend Structure Document for opencourse

This document describes the backend setup for the opencourse platform in simple, everyday terms. It covers how the server is organized, how data is stored and accessed, the APIs exposed to clients, hosting choices, infrastructure pieces, security safeguards, and how we keep everything running smoothly.

## 1. Backend Architecture

- **Overall design**: A stateless, RESTful service built on Node.js and Express (or a similar web framework). We follow a layered pattern:
  - **Controllers** handle incoming HTTP requests and send responses.
  - **Services** contain core business logic (for courses, users, enrollments, etc.).
  - **Repositories** (or data-access layers) talk to the database via Drizzle ORM.
- **Scalability**
  - Each instance runs without local storage, so we can spin up more servers behind a load balancer.
  - Database connection pooling and caching (see Infrastructure) help handle more traffic.
- **Maintainability**
  - Clear separation of concerns (controllers, services, repositories).
  - Monorepo structure (apps/backend, drizzle, tests) makes it easy to add new features or services.
- **Performance**
  - Lightweight framework with minimal overhead.
  - Caching layers reduce database load for frequently accessed data.

## 2. Database Management

- **Database type**: Relational
- **System used**: PostgreSQL (or another SQL database) managed via Drizzle ORM.
- **Drizzle ORM**
  - Defines tables and relationships in code.
  - Generates and runs SQL migration scripts stored under `drizzle/*.sql`.
  - Tracks migration history in `drizzle/meta/_journal.json` and snapshots in `drizzle/meta/snapshot.json`.
- **Data practices**
  - Migrations are versioned and peer-reviewed before deployment.
  - Backups and snapshots are scheduled regularly.
  - Connection pooling ensures efficient use of database resources.

## 3. Database Schema

Below is a simplified, human-friendly overview of the main tables and relationships, followed by the PostgreSQL definitions:

Tables and key columns:

- **users**: stores user profiles and credentials
  - id, email, password_hash, role (student/instructor/admin), created_at
- **courses**: stores course details
  - id, title, description, created_by (references users), created_at
- **enrollments**: tracks which users are enrolled in which courses
  - id, user_id (references users), course_id (references courses), enrolled_at
- **roles**: optional table for role-based access (if more roles needed)
  - id, name, description

PostgreSQL schema definitions:

```sql
-- users table
enable extension if not exists "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- enrollments table
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, course_id)
);

-- roles table (optional)
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT
);
```

## 4. API Design and Endpoints

We expose a versioned RESTful API under `/api/v1`. Key endpoints include:

- **Authentication**
  - `POST /api/v1/auth/register` : register a new user
  - `POST /api/v1/auth/login` : log in and receive a JWT token
- **User management**
  - `GET /api/v1/users/me` : get current profile
  - `PUT /api/v1/users/me` : update profile information
- **Course management**
  - `GET /api/v1/courses` : list all courses
  - `POST /api/v1/courses` : create a new course (instructors/admin)
  - `GET /api/v1/courses/:id` : get course details
  - `PUT /api/v1/courses/:id` : update course (owner or admin)
  - `DELETE /api/v1/courses/:id` : remove a course
- **Enrollment**
  - `POST /api/v1/courses/:id/enroll` : enroll current user
  - `DELETE /api/v1/courses/:id/enroll` : unenroll current user

All protected routes require a valid JWT in the `Authorization` header. Role checks happen in middleware.

## 5. Hosting Solutions

- **Cloud provider**: AWS (can also be GCP or Azure)
- **Compute**
  - Docker containers running on ECS or EKS for easy scaling.
  - Auto Scaling Groups if using EC2 directly.
- **Database**
  - Amazon RDS for PostgreSQL with multi-AZ deployment.
- **Benefits**
  - **Reliability**: managed services with automatic failover.
  - **Scalability**: horizontal scaling of stateless containers behind a load balancer.
  - **Cost-effectiveness**: pay-as-you-go, and rightsizing instances based on usage.

## 6. Infrastructure Components

- **Load Balancer**: AWS Application Load Balancer (ALB) distributes traffic across multiple backend instances.
- **Caching**: Redis or ElastiCache for in-memory caching of session data, frequently read course lists, and rate limiting.
- **CDN**: CloudFront to serve static assets (if any) and speed up API responses for global users.
- **Message Queue (optional)**: Amazon SQS or RabbitMQ for background jobs (e.g., sending emails, processing uploads).

These pieces work together so that user requests arrive at the load balancer, go to healthy application instances, and any heavy or repeated reads hit the cache rather than the database.

## 7. Security Measures

- **Authentication & Authorization**
  - JWT tokens for stateless user sessions.
  - Role-based access control enforced in middleware.
- **Data protection**
  - HTTPS everywhere (TLS certificates via AWS Certificate Manager).
  - Encryption at rest for RDS and encryption in transit for database connections.
- **Input validation**
  - Use validation library (e.g., Joi or Yup) on all incoming data.
- **HTTP headers & best practices**
  - Helmet middleware to set secure headers.
  - CORS configured to allow only trusted origins.
- **Dependency management**
  - Automated audits (`npm audit`, Snyk) to catch vulnerable packages.

## 8. Monitoring and Maintenance

- **Logging**
  - Structured logs with Winston or Pino.
  - Centralized log storage in CloudWatch or a logging service.
- **Performance monitoring**
  - AWS CloudWatch metrics and alarms.
  - Application performance monitoring with Datadog, New Relic, or similar.
- **Error tracking**
  - Sentry or Rollbar to capture unhandled exceptions and performance issues.
- **Maintenance routines**
  - Automated backups of the database (daily snapshots).
  - Routine health checks and rolling deployments for zero-downtime releases.
  - Regular dependency upgrades and security patching.

## 9. Conclusion and Overall Backend Summary

The opencourse backend is a modern, modular service built around a RESTful API, a PostgreSQL database with Drizzle ORM migrations, and a clear separation of concerns. Hosted on AWS, it uses load balancing, caching, and CDN layers to stay responsive and reliable. Security is baked in at every level, from encrypted data flows to role-based access checks. Monitoring tools and scheduled maintenance keep the system healthy and up-to-date. This setup aligns perfectly with the project’s goal of delivering a scalable, maintainable, and user-friendly platform for open courses.