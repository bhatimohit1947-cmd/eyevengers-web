import nodemailer from 'nodemailer';

// Configure standard Nodemailer transporter
// The user needs to provide SMTP details in their .env
export const sendEmail = async (to: string, subject: string, html: string) => {
  // If SMTP is not configured, skip immediately to prevent hanging
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('SMTP credentials not configured, skipping email delivery.');
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 3000, // 3s max timeout
      socketTimeout: 3000,
      greetingTimeout: 3000,
    } as any);

    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: `"Eyevengers" <${process.env.SMTP_USER || 'noreply@eyevengers.com'}>`,
      to,
      subject,
      html,
    });

    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email (non-blocking):', error);
    return false;
  }
};
