# GitHub Setup Guide

## Steps to Push Your Project to GitHub

### 1. Create a New Repository on GitHub
1. Go to https://github.com
2. Click the "+" icon in the top right and select "New repository"
3. Name your repository (e.g., "mern-social-media")
4. Choose "Public" or "Private"
5. **DO NOT** initialize with README (we already have one)
6. Click "Create repository"

### 2. Configure Git (First Time Only)
Open PowerShell in the project folder and run:

```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 3. Add All Files to Git
```powershell
cd C:\Users\Dell\Desktop\mern
git add .
```

### 4. Commit Your Changes
```powershell
git commit -m "Initial commit: MERN social media application"
```

### 5. Connect to Your GitHub Repository
Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

Example:
```powershell
git remote add origin https://github.com/johndoe/mern-social-media.git
```

### 6. Push to GitHub
```powershell
git branch -M main
git push -u origin main
```

### 7. Enter GitHub Credentials
When prompted, enter:
- Username: Your GitHub username
- Password: Your GitHub Personal Access Token (not your account password)

**How to create a Personal Access Token:**
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token"
3. Give it a name and select "repo" scope
4. Click "Generate token"
5. Copy the token and use it as your password

---

## Quick Command Reference

```powershell
# Check status
git status

# Add new changes
git add .

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push

# Pull latest changes
git pull

# Create a new branch
git checkout -b feature-name

# Switch branches
git checkout main

# View commit history
git log --oneline
```

---

## Important Files Created

✅ **Backend/.gitignore** - Excludes node_modules, .env, uploads
✅ **Frontend/.gitignore** - Excludes node_modules, .env, build
✅ **Backend/.env.example** - Template for environment variables
✅ **Frontend/.env.example** - Template for frontend config
✅ **README.md** - Project documentation

---

## What's NOT Uploaded to GitHub (Intentionally)

- `.env` files (sensitive credentials)
- `node_modules/` folders (dependencies)
- `uploads/` folder (user-generated content)
- Log files
- IDE settings

---

## Setting Up the Project from GitHub (For Others)

When someone clones your repository, they should:

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   cd YOUR_REPO_NAME
   ```

2. Install Backend dependencies:
   ```bash
   cd Backend
   npm install
   cp .env.example .env
   # Edit .env with their own values
   npm run dev
   ```

3. Install Frontend dependencies:
   ```bash
   cd ../Frontend
   npm install
   cp .env.example .env
   # Edit .env if needed
   npm start
   ```

---

## Need Help?

- GitHub Docs: https://docs.github.com
- Git Documentation: https://git-scm.com/doc
- Create GitHub Token: https://github.com/settings/tokens
