#!/bin/bash
set -e

echo "Starting build process..."

# Check Node version
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Install dependencies
echo "Installing dependencies..."
npm ci

# Run type check
echo "Running TypeScript check..."
npm run typecheck

# Build client
echo "Building client..."
npm run build:client

# Verify build output
echo "Verifying build output..."
ls -la dist/spa/
ls -la dist/spa/assets/

echo "Build completed successfully!" 