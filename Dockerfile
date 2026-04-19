# Use official Node.js image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your frontend code
COPY . .

# Expose the port Next.js runs on
EXPOSE 3000

# Start Next.js in development mode (easiest for testing right now)
CMD ["npm", "run", "dev"]