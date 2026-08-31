import nodemailer from 'nodemailer';

// Configure standard Nodemailer transporter
// The user needs to provide SMTP details in their .env
export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER, // e.g., 'your-email@gmail.com'
        pass: process.env.SMTP_PASS, // e.g., 'App Password'
      },
    });

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
    console.error('Error sending email:', error);
    return false;
  }
};
