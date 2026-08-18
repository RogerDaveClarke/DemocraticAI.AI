# Parliament Explorer Frontend - Production Dockerfile
# Multi-stage build for React application with OAuth configuration

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Remove Windows-specific dependencies for Linux build and install
RUN sed -i '/@rollup\/rollup-win32-x64-msvc/d' package.json && npm ci --legacy-peer-deps

# Copy source code and configuration
COPY . .

ENV NODE_ENV=production

# Build the React application
RUN npm run build

# Production stage with NGINX
FROM nginx:alpine

# Install security updates
RUN apk update && apk upgrade && \
    apk add --no-cache curl

# Create non-root user for security
RUN addgroup -g 1001 -S parliament && \
    adduser -S parliament -u 1001

# Copy custom nginx configuration optimized for Cloud Run
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built React application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create directory for nginx pid file with proper permissions
RUN mkdir -p /var/cache/nginx && \
    chown -R parliament:parliament /var/cache/nginx && \
    chown -R parliament:parliament /usr/share/nginx/html && \
    touch /var/run/nginx.pid && \
    chown parliament:parliament /var/run/nginx.pid

# Switch to non-root user
USER parliament

# Expose the port Cloud Run expects
EXPOSE 80

# Health check for container monitoring
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1

# Start nginx directly
CMD ["nginx", "-g", "daemon off;"]
