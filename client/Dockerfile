FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# For development server
ENV HOST=0.0.0.0
EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "--port", "3000"]
