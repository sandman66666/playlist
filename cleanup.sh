#!/bin/bash

# Exit on error
set -e

echo "Starting project cleanup..."

# Create backup
echo "Creating backup..."
timestamp=$(date +%Y%m%d_%H%M%S)
backup_dir="../spotify-playlist-manager-backup-$timestamp"
cp -r . "$backup_dir"
echo "Backup created at $backup_dir"

# Clean up frontend
echo "Cleaning up frontend..."
cd frontend

# Remove unnecessary files
rm -f src/App.js
rm -f src/hooks/useSpotify.ts
rm -f src/components/BrandForm.tsx
rm -f src/components/BrandPlaylist.tsx
rm -f src/components/CallbackHandler.tsx
rm -f src/components/Dashboard.tsx
rm -f src/components/Login.tsx
rm -f src/config.js
rm -f *.sh
rm -f src/reportWebVitals.ts

# Create new directory structure
echo "Creating new directory structure..."
mkdir -p src/api
mkdir -p src/components/brand
mkdir -p src/components/playlist
mkdir -p src/components/shared
mkdir -p src/pages

# Move files to their new locations
echo "Moving files to new locations..."
mv src/components/shared/Button.tsx src/components/shared/ 2>/dev/null || true
mv src/components/shared/Form.tsx src/components/shared/ 2>/dev/null || true
mv src/components/shared/Modal.tsx src/components/shared/ 2>/dev/null || true
mv src/components/brand/BrandCustomizer.tsx src/components/brand/ 2>/dev/null || true
mv src/components/brand/MusicPreview.tsx src/components/brand/ 2>/dev/null || true
mv src/components/playlist/PlaylistCard.tsx src/components/playlist/ 2>/dev/null || true

# Move other files
mv src/api/client.ts src/api/ 2>/dev/null || true
mv src/contexts/AuthContext.ts src/contexts/ 2>/dev/null || true
mv src/contexts/ToastContext.ts src/contexts/ 2>/dev/null || true
mv src/hooks/useQueries.ts src/hooks/ 2>/dev/null || true
mv src/types/index.ts src/types/ 2>/dev/null || true

# Clean up backend
echo "Cleaning up backend..."
cd ../backend

# Remove unnecessary files
rm -f __pycache__/* 2>/dev/null || true
find . -name "*.pyc" -delete
find . -name "__pycache__" -type d -delete

echo "Cleanup completed successfully!"
echo "Next steps:"
echo "1. Update the code files as per the new structure"
echo "2. Run npm install to ensure all dependencies are up to date"
echo "3. Test the application to ensure everything works correctly"