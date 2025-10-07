# Security Guidelines for the **opencourse** Platform

This document outlines mandatory security principles, best practices, and actionable recommendations tailored to the `opencourse` repository. Adhering to these guidelines will ensure a secure, resilient, and maintainable backend service for managing open courses.

---

## 1. Security by Design & Project Overview

- Embed security considerations at every stage—from design and implementation to testing and deployment.  
- Maintain a clear separation of concerns:  
  - **`apps/backend`**: Business logic, API endpoints, authentication/authorization.  
  - **`drizzle`**: Database schema definitions, migrations, metadata.
- Adopt a **monorepo structure** with consistent tooling (linters, formatters, CI/CD pipelines) to enforce uniform security standards across all components.

---

## 2. Authentication & Access Control

### 2.1 Robust Authentication
- Implement secure user registration and login flows.  
- Use **bcrypt** or **Argon2** with per-user salts to hash passwords.  
- Enforce password policies: minimum length (≥ 12 characters), complexity (uppercase, lowercase, digits, symbols).

### 2.2 Session & Token Management
- Prefer **JWT** for stateless sessions:  
  - Use strong signing algorithms (e.g., HS256 or RS256).  
  - Validate `exp`, `iat`, and `aud` claims server-side.  
  - Rotate secrets periodically and support token revocation (blacklist/whitelist).
- Secure cookies storing tokens with `HttpOnly`, `Secure`, and `SameSite=Strict` attributes if cookies are used.

### 2.3 Role-Based Access Control (RBAC)
- Define clearly scoped roles (e.g., `student`, `instructor`, `admin`).  
- Enforce authorization checks on every protected endpoint in `apps/backend`.  
- Deny by default: any request with missing/insufficient privileges must return `403 Forbidden`.

### 2.4 Multi-Factor Authentication (MFA)
- Offer optional MFA (TOTP or SMS-based) for instructors and admins.  
- Require MFA enrollment before granting elevated privileges.

---

## 3. Input Handling & Output Encoding

### 3.1 Server-Side Validation
- Never trust client-side checks.  
- Use a validation library (e.g., `Joi`, `zod`) to define strict schemas for all API inputs (JSON payloads, query parameters, path variables).

### 3.2 Preventing Injection Attacks
- Use Drizzle ORM or parameterized queries for all database interactions—never concatenate user data into raw SQL.  
- Sanitize and validate any dynamic fragments (e.g., table or column names) before use.

### 3.3 Mitigating XSS & Template Injection
- If rendering HTML, apply context-aware encoding/escaping (e.g., Handlebars auto-escaping).  
- Implement a strict **Content Security Policy (CSP)** header:
  ```
  Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none';
  ```

### 3.4 Validating Redirects & Forwards
- Maintain an allow-list of permitted redirect URIs.  
- Reject any redirect targets not explicitly approved.

### 3.5 Secure File Uploads (if applicable)
- Verify file MIME types and extensions.  
- Scan uploads for malware.
- Store files outside the webroot with restrictive permissions.

---

## 4. Data Protection & Privacy

### 4.1 Encryption In Transit & At Rest
- Enforce **TLS 1.2+** for all HTTP/API traffic.  
- Enable `Strict-Transport-Security` header:
  ```
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  ```
- Encrypt sensitive data at rest using AES-256 or database-native encryption features.

### 4.2 Secrets Management
- Do **not** store secrets (DB credentials, JWT keys) in source code or plain `.env` files.  
- Use a vault solution (e.g., AWS Secrets Manager, HashiCorp Vault).

### 4.3 Data Minimization & Privacy
- Collect only necessary user data.  
- Mask or redact PII in logs and error messages.
- Implement a secure deletion policy for user data in compliance with GDPR/CCPA.

---

## 5. API & Service Security

### 5.1 HTTPS Enforcement & CORS
- Redirect all HTTP requests to HTTPS.  
- Configure CORS to allow only trusted origins:
  ```js
  app.use(cors({ origin: ['https://yourdomain.com'] }));
  ```

### 5.2 Rate Limiting & Throttling
- Protect endpoints against brute-force and DoS attacks using rate limiter middleware (e.g., `express-rate-limit`).

### 5.3 Versioning & HTTP Methods
- Prefix routes with versioning (`/api/v1/...`).  
- Use correct HTTP verbs: GET for reads, POST for creates, PUT/PATCH for updates, DELETE for removals.

---

## 6. Web Application Security Hygiene

### 6.1 CSRF Protection
- For state-changing operations, implement anti-CSRF tokens (Synchronizer Token Pattern).

### 6.2 Security Response Headers
- In addition to CSP and HSTS, configure:
  - `X-Content-Type-Options: nosniff`  
  - `X-Frame-Options: DENY`  
  - `Referrer-Policy: no-referrer`

### 6.3 Secure Cookie Attributes
- Set `SameSite=Strict` or `Lax` as appropriate.  
- Always include `Secure` and `HttpOnly` flags.

---

## 7. Infrastructure & Configuration Management

### 7.1 Hardened Server Configurations
- Disable unused services and default accounts.  
- Restrict open ports to only those necessary (e.g., 443, 22 for admins).  
- Keep OS and dependencies up to date via automated patching.

### 7.2 TLS/SSL Best Practices
- Use strong cipher suites (ECDHE + AES-GCM).  
- Disable SSLv3, TLS 1.0, and TLS 1.1.

### 7.3 Environment & Config Isolation
- Use distinct environments (`development`, `staging`, `production`) with isolated configurations and secrets.

---

## 8. Dependency Management

- Maintain `package-lock.json` to ensure deterministic builds.  
- Use SCA tools (e.g., `npm audit`, Snyk) in CI to detect vulnerable dependencies.
- Regularly review and upgrade dependencies; remove unused packages to minimize attack surface.

---

## 9. Logging, Monitoring & Incident Response

- Implement structured logging (e.g., JSON) with a library like Winston or Pino.  
- Avoid logging sensitive data (passwords, tokens).  
- Configure centralized log aggregation and real-time alerting for security events.
- Define an incident response plan: detection, analysis, containment, eradication, recovery, and lessons learned.

---

## 10. Testing & CI/CD Security

- Integrate security tests (SAST/SCA) into the CI pipeline.  
- Run automated unit, integration, and API tests for every PR.  
- Enforce branch protection rules and require code reviews before merges.

---

By following these guidelines, the `opencourse` backend will benefit from a robust security posture, safeguarding user data and ensuring reliable service delivery. Regularly review and update this document as the codebase evolves and new threats emerge.