# docs/Dockerfile
FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Add a startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Use the startup script as the entrypoint
ENTRYPOINT ["/start.sh"]
