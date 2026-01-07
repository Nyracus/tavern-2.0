#!/bin/bash

echo "🔧 Setting up automated testing..."

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Initialize husky
echo "🐕 Setting up Husky (Git hooks)..."
npx husky install

# Make pre-commit hook executable
chmod +x .husky/pre-commit

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Run tests: npm test"
echo "2. Tests will now run automatically before each commit"
echo "3. View results: Open test-results/test-report.html in your browser"
echo ""
echo "🧪 To test the automation, try making a commit!"

