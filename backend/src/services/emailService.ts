import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { AppError } from "../middleware/errorHandler.js";

function getTransporter() {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    throw new AppError("Email (SMTP) is not configured", 503);
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const transporter = getTransporter();

  const info = await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });

  return { messageId: info.messageId };
}

export async function sendWelcomeEmail(to: string, name?: string) {
  return sendEmail({
    to,
    subject: "Welcome to Lunyon",
    html: `<p>Hi ${name ?? "there"},</p><p>Welcome to Lunyon. Your workspace is ready.</p>`,
    text: `Hi ${name ?? "there"}, Welcome to Lunyon. Your workspace is ready.`,
  });
}
