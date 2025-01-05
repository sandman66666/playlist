#!/bin/bash

# Exit on error
set -e

echo "Starting frontend update process..."

# Save current directory
FRONTEND_DIR=$(pwd)

# Update package.json
echo "Updating package.json..."
cat > package.json << 'EOF'
{
  "name": "spotify-playlist-manager",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "axios": "^1.7.9",
    "cra-template-typescript": "1.2.0",
    "html-webpack-plugin": "^5.6.3",
    "lodash": "^4.17.21",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "react-scripts": "5.0.1",
    "web-vitals": "^4.2.4"
  },
  "scripts": {
    "dev": "react-scripts start",
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "devDependencies": {
    "@babel/plugin-proposal-private-property-in-object": "^7.21.11",
    "@types/react": "^18.2.0",
    "@types/react-router-dom": "^5.3.3",
    "@types/lodash": "^4.14.202",
    "typescript": "^4.9.5",
    "ajv": "^8.12.0",
    "ajv-keywords": "^5.1.0",
    "schema-utils": "^4.2.0",
    "webpack": "^5.88.2",
    "webpack-dev-server": "^4.15.1"
  }
}
EOF

# Add TypeScript config if it doesn't exist
if [ ! -f "tsconfig.json" ]; then
  echo "Adding TypeScript configuration..."
  cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": "src"
  },
  "include": ["src"]
}
EOF
fi

# Create types directory content
echo "Creating types definitions..."
cat > src/types/index.ts << 'EOF'
export interface TokenInfo {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  status: string;
}

export interface BrandProfile extends Brand {
  brand_essence: {
    core_identity: string;
    heritage: string;
    brand_voice: string;
  };
  aesthetic_pillars: {
    visual_language: string[];
    emotional_attributes: string[];
    signature_elements: string[];
  };
  cultural_positioning: {
    philosophy: string;
    core_values: string[];
    cultural_codes: string[];
  };
  target_mindset: {
    aspirations: string[];
    lifestyle_attributes: string[];
  };
  brand_expressions: {
    tone: string[];
    experience: string[];
  };
}

export interface PlaylistTrack {
  id: string;
  name: string;
  artists: Array<{
    name: string;
    id: string;
  }>;
  album: {
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
  uri: string;
  preview_url?: string;
}
EOF

# Convert JS files to TS/TSX
echo "Converting files to TypeScript..."
for file in src/components/*.js src/components/*.jsx; do
  if [ -f "$file" ]; then
    newfile="${file%.*}.tsx"
    if [ "$file" != "$newfile" ]; then
      mv "$file" "$newfile"
      echo "Converted $file to $newfile"
    fi
  fi
done

for file in src/contexts/*.js; do
  if [ -f "$file" ]; then
    newfile="${file%.*}.ts"
    if [ "$file" != "$newfile" ]; then
      mv "$file" "$newfile"
      echo "Converted $file to $newfile"
    fi
  fi
done

# Remove Callback.js if it exists (we're using CallbackHandler.tsx)
rm -f src/components/Callback.js src/components/Callback.jsx src/components/Callback.tsx

echo "Installing dependencies..."
npm install

echo "Frontend update completed successfully!"
echo ""
echo "Next steps:"
echo "1. Review and fix any TypeScript errors in the components"
echo "2. Test the authentication flow"
echo "3. Start the development server with 'npm start'"