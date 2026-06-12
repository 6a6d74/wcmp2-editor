# Stage 1: build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: serve with vite preview (no nginx — proxy provided externally)
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY vite.config.ts ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
EXPOSE 4173
CMD ["npm", "start"]
