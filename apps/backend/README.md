# OpenCourse Backend

## Development with Docker Compose

For local development, you can use Docker Compose to run the services:

### Run PostgreSQL database only
```bash
npm run docker:db
```

### Run both PostgreSQL database and backend in development mode
```bash
npm run docker:dev
```

### Run production setup
```bash
npm run docker:prod
```

## Environment Variables

The application uses environment variables for configuration. Copy the `.env.example` file to `.env` and adjust the values as needed:

```bash
cp .env.example .env
```

Key environment variables:
- `POSTGRES_DB`: Database name (default: opencourse_dev)
- `POSTGRES_USER`: Database user (default: opencourse_user)
- `POSTGRES_PASSWORD`: Database password (default: opencourse_password)
- `POSTGRES_PORT`: PostgreSQL port (default: 5432)
- `DATABASE_URL`: Full database connection URL

## Database Management

### Generate migrations
```bash
npm run db:generate
```

### Run migrations
```bash
npm run db:migrate
```

### Open database studio
```bash
npm run db:studio
```