const nodemailer = require('nodemailer');

const getTransporter = () => {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_SECURE,
    SMTP_SERVICE,
  } = process.env;

  if (!SMTP_USER || !SMTP_PASS) {
    return null;
  }

  if (SMTP_SERVICE) {
    return nodemailer.createTransport({
      service: SMTP_SERVICE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }

  if (!SMTP_HOST) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: SMTP_SECURE === 'true',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

const sendOtpEmail = async ({ to, otp, username }) => {
  const transporter = getTransporter();

  if (!transporter) {
    console.log(`OTP for ${to} (${username}): ${otp}`);
    return {
      delivery: 'console',
      message: 'SMTP not configured. OTP was logged in the backend console.',
    };
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: 'BookGenie email verification OTP',
    text: `Hello ${username}, your BookGenie OTP is ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Verify your email</h2>
        <p>Hello ${username},</p>
        <p>Your BookGenie OTP is:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
        <p>This OTP expires in 10 minutes.</p>
      </div>
    `,
  });

  return {
    delivery: 'email',
    message: 'OTP sent to your email address.',
  };
};

module.exports = { sendOtpEmail };
