FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source files
COPY . .

# Default command - build will be done in docker-compose
CMD ["sh", "-c", "npm run build && rm -rf /app/output/* /app/output/.[!.]* 2>/dev/null || true && cp -r dist/. /app/output/ && echo 'Build completed. Files copied to /app/output' && tail -f /dev/null"]

