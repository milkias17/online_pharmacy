# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

# Install build dependencies
COPY package*.json ./
# Copy the prisma schema early to leverage Docker cache
COPY src/prisma ./src/prisma/

RUN npm install

# Copy source code and compile
COPY . .
RUN npx prisma generate --schema=./src/prisma/schema.prisma
RUN npm run build

# Stage 2: Runtime
FROM node:18-alpine
WORKDIR /app

# 1. IMPORTANT: Install libraries Prisma needs to run on Alpine
RUN apk add --no-cache openssl libc6-compat

# 2. Copy dependency files
COPY package*.json ./

# 3. Copy the prisma folder (REQUIRED to generate the client in the final stage)
COPY src/prisma ./src/prisma/

# 4. Install only production dependencies to keep the image small
RUN npm install --only=production

# 5. CRITICAL FIX: Re-generate the Prisma Client for the runtime environment
# This solves the "PrismaClient did not initialize yet" error
RUN npx prisma generate --schema=./src/prisma/schema.prisma

# 6. Copy the compiled JavaScript from the builder stage
COPY --from=builder /app/dist ./dist

# Environmental Settings
ENV NODE_ENV=production
EXPOSE 3000

# Final Command: Start the Node.js application
# Note: We removed 'prisma db push' to protect the shared database
CMD ["node", "dist/index.js"]
