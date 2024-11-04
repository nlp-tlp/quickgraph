FROM node:18
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all application files
COPY . .

# Create the start.sh script directly in the Dockerfile
RUN echo '#!/bin/sh\n\
echo "Starting docs service..."\n\
echo "Current directory contents:"\n\
ls -la\n\
echo "Checking contents of /app/static/img:"\n\
ls -la /app/static/img\n\
# Wait for the static images to be initialized\n\
while [ ! -f /app/static/img/.initialized ]; do\n\
    echo "Waiting for static images to be initialized..."\n\
    sleep 2\n\
done\n\
echo "Static images initialized successfully!"\n\
echo "Final contents of /app/static/img:"\n\
ls -la /app/static/img\n\
# Build the documentation\n\
npm run build\n\
# Start the server\n\
export PORT=4000\n\
npm run serve -- --port 4000' > /start.sh \
    && chmod +x /start.sh

# Use the startup script as the entrypoint
ENTRYPOINT ["/start.sh"]
