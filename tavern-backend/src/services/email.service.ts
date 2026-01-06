// src/services/email.service.ts
import nodemailer from 'nodemailer';
import { UserModel } from '../models/user.model';

// Email configuration
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER || 'taverncse470@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'taverncse470@gmail.com';
const FROM_NAME = process.env.FROM_NAME || 'Tavern Quest Platform';

// Create transporter
let transporter: nodemailer.Transporter | null = null;

if (SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
} else {
  console.warn('Email service not configured: SMTP_USER or SMTP_PASS not set');
}

export class EmailService {
  /**
   * Send an email
   */
  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
    if (!transporter) {
      console.warn('Email transporter not configured, skipping email send');
      return false;
    }

    try {
      const info = await transporter.sendMail({
        from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
        to,
        subject,
        text: text || this.htmlToText(html),
        html,
      });

      console.log('Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  /**
   * Get user email by user ID
   */
  async getUserEmail(userId: string): Promise<string | null> {
    try {
      const user = await UserModel.findById(userId).select('email').exec();
      return user?.email || null;
    } catch (error) {
      console.error('Failed to get user email:', error);
      return null;
    }
  }

  /**
   * Send notification email
   */
  async sendNotificationEmail(
    userId: string,
    title: string,
    message: string,
    type?: string,
    data?: any
  ): Promise<boolean> {
    const email = await this.getUserEmail(userId);
    if (!email) {
      console.warn(`User ${userId} has no email address`);
      return false;
    }

    const html = this.generateNotificationEmailHTML(title, message, type, data);
    const subject = `Tavern: ${title}`;

    return this.sendEmail(email, subject, html);
  }

  /**
   * Generate HTML email template for notifications
   */
  private generateNotificationEmailHTML(
    title: string,
    message: string,
    type?: string,
    data?: any
  ): string {
    const questLink = data?.questId
      ? `<p style="margin-top: 20px;"><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/quests/${data.questId}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Quest</a></p>`
      : '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🏰 Tavern Quest Platform</h1>
  </div>
  <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #333; margin-top: 0;">${title}</h2>
    <p style="color: #666; font-size: 16px;">${message}</p>
    ${questLink}
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    <p style="color: #999; font-size: 12px; text-align: center;">
      This is an automated notification from the Tavern Quest Platform.<br>
      You can manage your notification preferences in your account settings.
    </p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Convert HTML to plain text (simple version)
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  /**
   * Send quest application received email to NPC
   */
  async sendQuestApplicationReceived(
    npcId: string,
    questId: string,
    questTitle: string,
    adventurerName: string
  ): Promise<boolean> {
    const email = await this.getUserEmail(npcId);
    if (!email) return false;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🏰 New Quest Application</h1>
  </div>
  <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #333; margin-top: 0;">${adventurerName} applied to your quest!</h2>
    <p style="color: #666; font-size: 16px;"><strong>Quest:</strong> ${questTitle}</p>
    <p style="margin-top: 20px;"><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/npc/applications" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Review Applications</a></p>
  </div>
</body>
</html>
    `.trim();

    return this.sendEmail(email, `New Application: ${questTitle}`, html);
  }

  /**
   * Send quest application accepted email to Adventurer
   */
  async sendQuestApplicationAccepted(
    adventurerId: string,
    questId: string,
    questTitle: string,
    deadline?: Date
  ): Promise<boolean> {
    const email = await this.getUserEmail(adventurerId);
    if (!email) return false;

    const deadlineText = deadline
      ? `<p style="color: #666; font-size: 16px;"><strong>Deadline:</strong> ${deadline.toLocaleString()}</p>`
      : '';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✅ Application Accepted!</h1>
  </div>
  <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #333; margin-top: 0;">Congratulations!</h2>
    <p style="color: #666; font-size: 16px;">Your application for <strong>${questTitle}</strong> has been accepted!</p>
    ${deadlineText}
    <p style="margin-top: 20px;"><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/adventurer/applications" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Quest</a></p>
  </div>
</body>
</html>
    `.trim();

    return this.sendEmail(email, `Application Accepted: ${questTitle}`, html);
  }

  /**
   * Send payment received email to Adventurer
   */
  async sendPaymentReceived(
    adventurerId: string,
    questId: string,
    questTitle: string,
    amount: number
  ): Promise<boolean> {
    const email = await this.getUserEmail(adventurerId);
    if (!email) return false;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">💰 Payment Received!</h1>
  </div>
  <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #333; margin-top: 0;">Great work!</h2>
    <p style="color: #666; font-size: 16px;">You received <strong>${amount} gold</strong> for completing <strong>${questTitle}</strong>!</p>
    <p style="margin-top: 20px;"><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/adventurer/applications" style="background-color: #f59e0b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Quest</a></p>
  </div>
</body>
</html>
    `.trim();

    return this.sendEmail(email, `Payment Received: ${amount} gold for ${questTitle}`, html);
  }
}

export const emailService = new EmailService();


