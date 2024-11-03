#!/bin/sh
# docs/start.sh
echo "Starting docs service..."

echo "Current directory contents:"
ls -la

echo "Checking contents of /app/static/img:"
ls -la /app/static/img

# Wait for the static images to be initialized
while [ ! -f /app/static/img/.initialized ]; do
    echo "Waiting for static images to be initialized..."
    sleep 2
done

echo "Static images initialized successfully!"
echo "Final contents of /app/static/img:"
ls -la /app/static/img

# Build the documentation
npm run build

# Start the server
export PORT=4000
npm run serve -- --port 4000
