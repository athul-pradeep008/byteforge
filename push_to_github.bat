@echo off
echo Pushing project to GitHub repository: https://github.com/athul-pradeep008/byteforge.git ...
cd /d "%~dp0"

git init
git remote remove origin 2>nul
git remote add origin https://github.com/athul-pradeep008/byteforge.git
git branch -M main
git add .
git commit -m "Initial commit: Cyberimmune ByteForge project"
git push -u origin main

echo Done!
pause
