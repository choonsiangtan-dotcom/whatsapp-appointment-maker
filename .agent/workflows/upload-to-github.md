---
description: how to upload the application to GitHub
---

Follow these steps to upload your project to GitHub:

1. **Initialize Git Repository**
   Run this in your terminal:
   ```powershell
   git init
   ```

2. **Add Files to Staging**
   ```powershell
   git add .
   ```

3. **Commit Your Changes**
   ```powershell
   git commit -m "Initial commit: WhatsApp Appointment Maker"
   ```

4. **Create a Repository on GitHub**
   - Go to [github.com/new](https://github.com/new)
   - Name it `whatsapp-appointment-maker`
   - Keep it Public/Private as you prefer
   - Do **NOT** initialize with README, license, or gitignore (since we already have them)

5. **Connect and Push to GitHub**
   Copy the commands from your new GitHub repo page (example):
   ```powershell
   git remote add origin https://github.com/YOUR_USERNAME/whatsapp-appointment-maker.git
   git branch -M main
   git push -u origin main
   ```
