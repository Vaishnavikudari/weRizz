#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "🚀 [1/3] Upgrading pip and installing Python dependencies..."
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

echo "⚛️ [2/3] Installing frontend dependencies and building production assets..."
cd frontend
npm install --legacy-peer-deps
npm run build
cd ..

echo "✅ [3/3] Build completed successfully!"
