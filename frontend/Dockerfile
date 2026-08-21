# Stage 1: Build the Vite production assets
FROM node:20-alpine AS build

WORKDIR /app

# Copy package configurations and install packages
COPY package*.json ./
RUN npm install

# Copy application source files and compile
COPY . .
RUN npm run build

# Stage 2: Serve the compiled static bundle via lightweight Nginx Alpine
FROM nginx:alpine

# Remove default nginx contents and mount Vite build outcomes
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
