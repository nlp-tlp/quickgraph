# Use Node.js as the base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your Docusaurus project
COPY . .

# Build the site
RUN npm run build

# Expose port 4000
EXPOSE 4000

# Set environment variable for the port
ENV PORT=4000

# Command to serve the built site
CMD npx serve -s build -l 4000
