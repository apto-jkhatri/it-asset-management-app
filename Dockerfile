FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Expose the API port
EXPOSE 4000

# Start the server (Using dev:server:cjs logic or similar, but for production we should probably compile ts or use ts-node)
# Use ts-node for simplicity as per existing scripts, or compile if preferred. The existing "build" script builds frontend only.
# Start the server using tsx which handles TS/ESM seamlessly
CMD ["npx", "tsx", "server/index.ts"]
