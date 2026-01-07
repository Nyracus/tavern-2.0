@echo off
echo 🔧 Setting up automated testing...

REM Install dependencies if not already installed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
)

REM Initialize husky
echo 🐕 Setting up Husky (Git hooks)...
call npx husky install

echo ✅ Setup complete!
echo.
echo 📋 Next steps:
echo 1. Run tests: npm test
echo 2. Tests will now run automatically before each commit
echo 3. View results: Open test-results\test-report.html in your browser
echo.
echo 🧪 To test the automation, try making a commit!

pause

