#!/bin/sh
# docs/start.sh

# Wait for the static images to be initialized
while [ ! -f /app/static/img/.initialized ]; do
    echo "Waiting for static images to be initialized..."
    sleep 2
done

# Build the documentation
npm run build

# Start the server
npm run serve
