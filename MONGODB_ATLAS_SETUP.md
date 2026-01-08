# MongoDB Atlas - Team Access Setup Guide

This guide explains how to share your MongoDB Atlas cluster with teammates so everyone can access the same database and see the same data (including skills, users, quests, etc.).

## Option 1: Add Teammates as Database Users (Recommended)

This is the **recommended approach** for team collaboration. Each teammate gets their own database user credentials.

### Step 1: Add Teammates to Your Atlas Project

1. **Log in to MongoDB Atlas** (https://cloud.mongodb.com)
2. Go to your **Project** (top-left corner)
3. Click on **"Project Access"** (or "Project Settings" → "Access Manager")
4. Click **"Invite Users"** button
5. Enter your teammate's **email address**
6. Select their **role**:
   - **Project Read Only** - Can view but not modify
   - **Project Read/Write** - Can read and write data (recommended for development)
   - **Project Owner** - Full access (usually not needed)
7. Click **"Add User"**
8. Your teammate will receive an email invitation to join the project

### Step 2: Create Database User for Each Teammate

1. In MongoDB Atlas, go to **"Database Access"** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter a **username** (e.g., `teammate1`, `teammate2`)
5. Enter a **password** (or generate one)
6. Under **"Database User Privileges"**, select:
   - **"Atlas admin"** (for full access) OR
   - **"Read and write to any database"** (recommended)
7. Click **"Add User"**
8. **Share the credentials securely** with your teammate (use a secure channel like encrypted message, password manager, etc.)

### Step 3: Configure Network Access (IP Whitelist)

1. Go to **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. Choose one of:
   - **"Add Current IP Address"** - Adds your current IP
   - **"Allow Access from Anywhere"** - `0.0.0.0/0` (less secure, but easier for development)
   - **"Add IP Address"** - Enter specific IP addresses
4. Click **"Confirm"**

   **Note:** For development, you can temporarily allow access from anywhere (`0.0.0.0/0`), but for production, use specific IPs.

### Step 4: Get Your Connection String

1. Go to **"Database"** (left sidebar)
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** and version **"5.5 or later"**
5. Copy the connection string. It will look like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 5: Share Connection String with Teammates

**IMPORTANT:** Replace `<username>` and `<password>` in the connection string with the database user credentials you created for each teammate.

**Example:**
```
mongodb+srv://teammate1:their_password@cluster0.xxxxx.mongodb.net/tavern_db?retryWrites=true&w=majority
```

**Security Note:** 
- Never commit connection strings with passwords to Git
- Share credentials through secure channels (encrypted messages, password managers)
- Each teammate should have their own database user

### Step 6: Teammates Configure Their .env File

Each teammate should:

1. Navigate to `tavern-backend/` directory
2. Create or update their `.env` file:
   ```env
   MONGO_URI=mongodb+srv://teammate1:their_password@cluster0.xxxxx.mongodb.net/tavern_db?retryWrites=true&w=majority
   PORT=3000
   NODE_ENV=local
   JWT_SECRET=super_secret_change_me
   JWT_EXPIRES_IN=7d
   ```
3. Replace the connection string with the one you shared (with their specific username/password)
4. Make sure `.env` is in `.gitignore` (it should be already)

---

## Option 2: Share Single Database User (Simpler, Less Secure)

If you want a quicker setup (not recommended for production):

1. Create **one database user** in Atlas
2. Share the **same connection string** with all teammates
3. Everyone uses the same credentials

**⚠️ Warning:** This is less secure because:
- Everyone shares the same credentials
- If one person's credentials leak, everyone is affected
- Harder to track who made what changes

---

## Troubleshooting

### "Authentication failed" error
- Verify the username and password in the connection string
- Make sure the database user was created correctly in Atlas
- Check that the password doesn't contain special characters that need URL encoding

### "IP not whitelisted" error
- Go to **"Network Access"** in Atlas
- Add your current IP address or allow access from anywhere (`0.0.0.0/0`)

### "Connection timeout" error
- Check your internet connection
- Verify the cluster is running (not paused) in Atlas
- Make sure the connection string is correct

### Teammates can't see data
- Verify they're using the correct connection string
- Check that the database name in the connection string matches (e.g., `tavern_db`)
- Ensure they're connecting to the same cluster

---

## Quick Checklist for Team Lead

- [ ] Add teammates to Atlas project (Project Access)
- [ ] Create database user for each teammate (Database Access)
- [ ] Configure IP whitelist (Network Access)
- [ ] Get connection string (Database → Connect)
- [ ] Share connection string with each teammate (with their specific credentials)
- [ ] Verify teammates can connect successfully

---

## Security Best Practices

1. ✅ **Use separate database users** for each teammate
2. ✅ **Never commit `.env` files** to Git
3. ✅ **Use strong passwords** for database users
4. ✅ **Limit IP access** when possible (avoid `0.0.0.0/0` in production)
5. ✅ **Rotate passwords** periodically
6. ✅ **Remove access** when teammates leave the project

---

## Example .env File Template

```env
# MongoDB Atlas Connection String
# Format: mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?<options>
MONGO_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/tavern_db?retryWrites=true&w=majority

# Server Configuration
PORT=3000
NODE_ENV=local

# JWT Configuration
JWT_SECRET=super_secret_change_me
JWT_EXPIRES_IN=7d
```

---

## Need Help?

If you encounter issues:
1. Check MongoDB Atlas dashboard for cluster status
2. Verify network access settings
3. Test connection string in MongoDB Compass (desktop app)
4. Check Atlas logs for connection attempts
