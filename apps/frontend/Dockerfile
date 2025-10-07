# Stage 1: Install dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json* ./
# If package-lock.json exists, use ci, otherwise use install
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json* ./
COPY . .

# Install all dependencies (including dev dependencies) for build
RUN npm install

# Build arguments for environment variables
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_APP_URL

# Build the application
RUN NEXT_TELEMETRY_DISABLED=1 npm run build

# Stage 3: Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]