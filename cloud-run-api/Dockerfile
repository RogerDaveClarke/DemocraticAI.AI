# Parliament Explorer API - Production Dockerfile
# Multi-stage build for TypeScript compilation and production deployment

# Build stage
FROM node:18-slim AS builder

WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev for TypeScript compilation)
RUN npm ci

# Copy source code
COPY src/ ./src/

# Compile TypeScript to JavaScript
RUN npm run build

# Production stage
FROM node:18-slim

# Install security updates and required packages
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
    ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -r parliament && useradd -r -g parliament parliament

WORKDIR /app

# Copy package files for production dependencies only
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled JavaScript from builder stage
COPY --from=builder /app/dist/ ./dist/

# Copy any additional required files
COPY README.md ./

# Change ownership to non-root user
RUN chown -R parliament:parliament /app

# Switch to non-root user
USER parliament

# Expose the port Cloud Run expects
EXPOSE 8080

# Health check for container monitoring
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start the application
CMD ["npm", "start"]