#!/bin/bash

# ==============================================================================
# EchoLens - Automated Google Cloud Deployment Script
# ==============================================================================
# This script automates the build and deployment process to Google Cloud 
# (via Firebase Hosting). It ensures a clean installation, builds the Vite 
# React application, and deploys the static assets to the global CDN.
# ==============================================================================

set -e # Exit immediately if a command exits with a non-zero status.

echo "🚀 Starting automated deployment for EchoLens..."

echo "📦 Step 1: Installing dependencies..."
npm ci

echo "🏗️ Step 2: Building the production application..."
npm run build

echo "☁️ Step 3: Deploying to Google Cloud (Firebase Hosting)..."
# Requires firebase-tools to be installed and authenticated
firebase deploy --only hosting

echo "✅ Deployment complete! EchoLens is now live on Google Cloud."
