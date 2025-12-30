# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

# Install build dependencies
COPY package*.json ./
# Note: We copy the prisma folder early to cache the prisma generation
COPY src/prisma ./src/prisma/

RUN npm install

# Copy the rest of the source code
COPY . .

# Generate Prisma Client (crucial for the build step)
RUN npx prisma generate --schema=./src/prisma/schema.prisma

# Compile TypeScript to JavaScript
RUN npm run build

# Stage 2: Runtime
FROM node:18-alpine
WORKDIR /app

# IMPORTANT: Prisma on Alpine needs openssl and libc6-compat
RUN apk add --no-cache openssl libc6-compat

# Copy only the package files and install production-only dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy the compiled JS from the builder stage
COPY --from=builder /app/dist ./dist
# Copy the prisma folder so we can run migrations/push at runtime
COPY --from=builder /app/src/prisma ./src/prisma

# Set environment to production
ENV NODE_ENV=production

# Expose the service port
EXPOSE 3000

# The startup command: 
# 1. Synchronize the database schema with the DB
# 2. Start the compiled node application

CMD ["node", "dist/index.js"]
