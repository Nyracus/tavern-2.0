# Email Setup Guide

This project uses Nodemailer to send email notifications via Gmail SMTP.

## Gmail Setup

To use `taverncse470@gmail.com` for sending emails, you need to:

### 1. Enable 2-Step Verification
1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification

### 2. Generate App Password
1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" and "Other (Custom name)"
3. Enter "Tavern Quest Platform" as the name
4. Click "Generate"
5. Copy the 16-character password (spaces don't matter)

### 3. Configure Environment Variables

Add these to your `.env` file in `tavern-backend/`:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=taverncse470@gmail.com
SMTP_PASS=your_16_character_app_password_here
FROM_EMAIL=taverncse470@gmail.com
FROM_NAME=Tavern Quest Platform

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173
```

### 4. Email Notifications Sent

The system automatically sends emails for:
- ✅ Quest application received (NPC)
- ✅ Quest application accepted (Adventurer)
- ✅ Quest application rejected (Adventurer)
- ✅ Quest completion submitted (NPC)
- ✅ Payment received (Adventurer)

### Testing

After configuration, restart the backend server. Emails will be sent automatically when these events occur.

## Troubleshooting

- **"Invalid login"**: Make sure you're using an App Password, not your regular Gmail password
- **"Connection timeout"**: Check your firewall/network settings
- **No emails sent**: Check server logs for email service warnings
- **Emails in spam**: Gmail may initially mark automated emails as spam




