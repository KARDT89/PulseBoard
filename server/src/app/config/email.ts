import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) console.error('SMTP connection failed:', error);
  else console.log('SMTP server ready');
});

const sendMail = async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
  await transporter.sendMail({
    from: `${process.env.SMTP_FROM_EMAIL} <${process.env.SMTP_FROM_EMAIL}>`,
    to,
    subject,
    html,
  });
};

const sendVerificationEmail = async (email: string, token: string) => {
  const url = `${process.env.CLIENT_URL}/api/auth/verify-email/${token}`;
  await transporter.sendMail({
    from: `${process.env.SMTP_FROM_EMAIL} <${process.env.SMTP_FROM_EMAIL}>`,
    to: email,
    subject: 'Verify your email',
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #ffffff; color: #000000; padding: 20px; text-align: center;">
  
  <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 16px;">
    Welcome to DT89's Website
  </h2>

  <p style="font-size: 16px; color: #333333; margin-bottom: 24px;">
    Click the link below to verify your email. It expires in 24 hours.
  </p>

  <a href="${url}" 
     style="display: inline-block; padding: 12px 20px; font-size: 14px; color: #ffffff; background-color: #000000; text-decoration: none; border-radius: 4px;">
    Verify Email
  </a>

  <p style="margin-top: 20px; font-size: 12px; color: #777777;">
    Or copy and paste this link into your browser:
  </p>

  <p style="word-break: break-all; font-size: 12px; color: #555555;">
    ${url}
  </p>

</div>
    `,
  });
};

const sendResetPasswordEmail = async (email: string, token: string) => {
  const url = `${process.env.CLIENT_URL}/api/auth/reset-password/${token}`;

  await sendMail({
    to: email,
    subject: 'Reset your password',
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #ffffff; color: #000000; padding: 20px; text-align: center;">

  <h2 style="font-size: 22px; font-weight: bold; margin-bottom: 16px;">
    Password Reset
  </h2>

  <p style="font-size: 15px; color: #333333; margin-bottom: 24px;">
    Click the button below to reset your password. This link expires in 15 minutes.
  </p>

  <a href="${url}" 
     style="display: inline-block; padding: 12px 20px; font-size: 14px; color: #ffffff; background-color: #000000; text-decoration: none; border-radius: 4px;">
    Reset Password
  </a>

  <p style="margin-top: 20px; font-size: 12px; color: #777777;">
    Or copy and paste this link into your browser:
  </p>

  <p style="word-break: break-all; font-size: 12px; color: #555555;">
    ${url}
  </p>

  <p style="margin-top: 24px; font-size: 12px; color: #999999;">
    If you didn’t request this, you can safely ignore this email.
  </p>

</div>
    `,
  });
};

export { sendVerificationEmail, sendResetPasswordEmail, sendMail };
