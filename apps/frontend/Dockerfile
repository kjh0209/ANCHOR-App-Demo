FROM node:20-alpine

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (npm install instead of npm ci for flexibility without lock file)
RUN npm install

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start the application in development mode
CMD ["npm", "run", "dev"]
