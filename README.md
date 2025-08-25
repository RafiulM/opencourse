# OpenCourse

A modern online learning platform built with Next.js, Express.js, and Better Auth. OpenCourse provides a comprehensive solution for course management, user authentication, and learning experiences.

## 🚀 Features

- **Modern UI/UX**: Built with Shadcn/ui components and Tailwind CSS
- **Secure Authentication**: Powered by Better Auth with email/password signup
- **Full-stack TypeScript**: End-to-end type safety
- **Responsive Design**: Mobile-first responsive design
- **Database Integration**: PostgreSQL with Drizzle ORM
- **API Documentation**: Swagger/OpenAPI documentation
- **Monorepo Structure**: Organized with pnpm workspaces

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **UI Components**: Shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS v4 with CSS variables
- **Icons**: Lucide React
- **State Management**: Better Auth React hooks
- **TypeScript**: Full type safety

### Backend
- **Runtime**: Node.js with Express.js
- **Authentication**: Better Auth
- **Database**: PostgreSQL with Drizzle ORM
- **API Documentation**: Swagger UI
- **Security**: Helmet.js, CORS
- **Development**: Nodemon with ts-node

### Infrastructure
- **Package Manager**: pnpm with workspaces
- **Database Migrations**: Drizzle Kit
- **Environment**: Docker support
- **Linting**: ESLint
- **Formatting**: Prettier

## 📁 Project Structure

```
opencourse/
├── apps/
│   ├── frontend/                 # Next.js frontend application
│   │   ├── app/                 # App router pages
│   │   │   ├── login/           # Login page
│   │   │   ├── signup/          # Signup page
│   │   │   ├── layout.tsx       # Root layout
│   │   │   └── page.tsx         # Home page
│   │   ├── components/          # Reusable components
│   │   │   └── ui/              # Shadcn/ui components
│   │   ├── lib/                 # Utilities and configurations
│   │   │   ├── auth.ts          # Better Auth client setup
│   │   │   └── utils.ts         # Utility functions
│   │   └── package.json
│   └── backend/                 # Express.js backend application
│       ├── src/
│       │   ├── db/              # Database configuration
│       │   │   ├── schema/      # Database schemas
│       │   │   └── index.ts     # Database connection
│       │   ├── lib/             # Backend utilities
│       │   │   └── auth.ts      # Better Auth server setup
│       │   ├── routes/          # API routes
│       │   ├── services/        # Business logic
│       │   └── index.ts         # Express server
│       ├── drizzle/             # Database migrations
│       └── package.json
├── package.json                 # Root package.json
├── pnpm-workspace.yaml         # pnpm workspace configuration
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm 8+
- PostgreSQL 14+
- Docker (optional)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd opencourse
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**

**Backend** (`apps/backend/.env`):
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/opencourse"

# Server
PORT=5000

# CORS
CORS_ORIGINS="http://localhost:3000,http://localhost:5173"

# Better Auth (optional - for additional origins)
TRUSTED_ORIGINS="http://localhost:3000"
```

**Frontend** (`apps/frontend/.env.local`):
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

4. **Set up the database**
```bash
# Start PostgreSQL (if using Docker)
cd apps/backend
docker compose up -d

# Run migrations
pnpm db:migrate

# (Optional) Seed the database
pnpm db:seed
```

5. **Start the development servers**

In separate terminals:

```bash
# Start backend server
cd apps/backend
pnpm dev

# Start frontend server
cd apps/frontend
pnpm dev
```

The applications will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api-docs

## 🔐 Authentication System

### Better Auth Integration

OpenCourse uses [Better Auth](https://www.better-auth.com/) for secure user authentication:

**Features:**
- Email/password authentication
- Secure session management
- CSRF protection
- Trusted origins configuration
- TypeScript-first design

**Client Usage:**
```typescript
import { signUp, signIn, signOut, useSession } from '@/lib/auth'

// Sign up
await signUp.email({
  email: 'user@example.com',
  password: 'password',
  name: 'John Doe'
})

// Sign in
await signIn.email({
  email: 'user@example.com',
  password: 'password'
})

// Use session in components
const { data: session } = useSession()
```

**Server Configuration:**
```typescript
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  trustedOrigins: ["http://localhost:3000"]
})
```

## 🎨 UI Components

### Shadcn/ui Integration

The frontend uses Shadcn/ui components for a consistent, modern design:

**Available Components:**
- Forms (Input, Label, Button)
- Layout (Card, Separator)
- Feedback (Alert, Toast)
- Navigation (Avatar, Dropdown Menu)
- Data Display (Table, Badge)

**Usage Example:**
```typescript
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

<Card>
  <CardHeader>
    <CardTitle>Sign In</CardTitle>
  </CardHeader>
  <CardContent>
    <Input type="email" placeholder="Email" />
    <Button>Sign In</Button>
  </CardContent>
</Card>
```

## 📊 Database Schema

### User Management
```sql
-- Users table (handled by Better Auth)
users (
  id: string (primary key)
  email: string (unique)
  name: string
  emailVerified: boolean
  image: string (nullable)
  createdAt: timestamp
  updatedAt: timestamp
)

-- Sessions table (handled by Better Auth)
sessions (
  id: string (primary key)
  userId: string (foreign key)
  token: string
  expiresAt: timestamp
)
```

### Course Management (Future)
```sql
-- Courses
courses (
  id: string (primary key)
  title: string
  description: text
  createdAt: timestamp
  updatedAt: timestamp
)

-- Enrollments
enrollments (
  id: string (primary key)
  userId: string (foreign key)
  courseId: string (foreign key)
  enrolledAt: timestamp
)
```

## 🛠️ Development

### Available Scripts

**Root Level:**
```bash
pnpm dev          # Start both frontend and backend
pnpm build        # Build both applications
pnpm lint         # Lint all applications
```

**Frontend (`apps/frontend/`):**
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

**Backend (`apps/backend/`):**
```bash
pnpm dev          # Start development server with nodemon
pnpm build        # Compile TypeScript
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm test         # Run tests
pnpm db:generate  # Generate database migrations
pnpm db:migrate   # Run database migrations
pnpm db:studio    # Open Drizzle Studio
```

### Code Style

The project uses ESLint and Prettier for consistent code formatting:

```bash
# Check linting
pnpm lint

# Auto-fix linting issues
pnpm lint --fix
```

### Database Operations

```bash
# Generate new migration
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Open database studio
pnpm db:studio

# Reset database (development only)
pnpm db:reset
```

## 🚀 Deployment

### Frontend (Vercel Recommended)

1. Connect your repository to Vercel
2. Set environment variables:
   - `NEXT_PUBLIC_API_BASE_URL`
3. Deploy automatically on push

### Backend (Railway/Render/DigitalOcean)

1. Set up PostgreSQL database
2. Configure environment variables:
   - `DATABASE_URL`
   - `PORT`
   - `CORS_ORIGINS`
   - `TRUSTED_ORIGINS`
3. Deploy with `pnpm build && pnpm start`

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build individual services
docker build -t opencourse-frontend apps/frontend
docker build -t opencourse-backend apps/backend
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`pnpm lint && pnpm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Write TypeScript for all new code
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all CI checks pass

## 📝 API Documentation

Visit http://localhost:5000/api-docs when running the backend to explore the API documentation.

### Authentication Endpoints

```
POST /api/auth/sign-up/email    # Create new user account
POST /api/auth/sign-in/email    # Sign in with email/password
POST /api/auth/sign-out         # Sign out current user
GET  /api/auth/get-session      # Get current session
```

### Health Endpoints

```
GET  /api/health                # Health check
GET  /api/test                  # Test endpoint
POST /api/test                  # Test POST endpoint
```

## 🔧 Troubleshooting

### Common Issues

**CORS Errors:**
- Ensure `CORS_ORIGINS` includes your frontend URL
- Check `TRUSTED_ORIGINS` in Better Auth config

**Database Connection:**
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check database migrations are up to date

**Authentication Issues:**
- Verify frontend `NEXT_PUBLIC_API_BASE_URL` points to backend
- Check that both servers are running
- Ensure cookies are enabled in browser

**Build Errors:**
- Clear node_modules and reinstall: `rm -rf node_modules pnpm-lock.yaml && pnpm install`
- Check TypeScript errors: `pnpm tsc --noEmit`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

For questions and support:
- Create an issue in the repository
- Check the documentation
- Review the API documentation at `/api-docs`

---

**Happy Learning with OpenCourse! 🎓**