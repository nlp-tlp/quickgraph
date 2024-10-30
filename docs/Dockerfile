# # Use Node.js as the base image
# FROM node:18

# # Set working directory
# WORKDIR /app

# # Copy package files
# COPY package*.json ./

# # Install dependencies
# RUN npm install

# # Copy the rest of your Docusaurus project
# COPY . .

# # Build the site
# RUN npm run build

# # Expose port 4000
# EXPOSE 4000

# # Set environment variable for the port
# ENV PORT=4000

# # Command to serve the built site
# CMD npx serve -s build -l 4000

# Use Node.js as the base image
FROM node:18

# Install necessary utilities
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install gdown
RUN pip3 install gdown

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your Docusaurus project
COPY . .

# Create build directory
RUN mkdir -p build

# Download docs from Google Drive using folder ID
RUN gdown --folder https://drive.google.com/drive/folders/1nkrWcmUFl_5CXAIsLkR79F_H3w5b5Eft -O build --remaining-ok

# Expose port 4000
EXPOSE 4000

# Set environment variable for the port
ENV PORT=4000

# Command to serve the built site
CMD npx serve -s build -l 4000
