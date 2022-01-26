FROM node:14.17.0-alpine

# Set working directory
WORKDIR /usr/src/app

# Install dependencies
COPY ./package*.json ./
RUN npm install --silent

# Copy server source code
COPY . .

# Run server
EXPOSE 3001

# Start up server
CMD ["npm", "run", "server"]