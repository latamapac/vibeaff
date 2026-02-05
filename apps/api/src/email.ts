import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.example.com",
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
  },
});

const FROM = process.env.EMAIL_FROM ?? "noreply@vibeaff.com";

function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendPayoutReleasedEmail(to: string, amount: number, currency: string) {
  if (!isEmailConfigured()) return;
  await transporter.sendMail({
    from: FROM,
    to,
    subject: "VibeAff: Your payout has been released",
    html: `<h2>Payout Released</h2><p>Your payout of <strong>${currency} ${amount.toLocaleString()}</strong> has been released.</p><p>Thank you for being a VibeAff affiliate!</p>`,
  });
}

export async function sendConversionFlaggedEmail(to: string, conversionId: string, reason: string) {
  if (!isEmailConfigured()) return;
  await transporter.sendMail({
    from: FROM,
    to,
    subject: "VibeAff: Conversion flagged for review",
    html: `<h2>Conversion Flagged</h2><p>Conversion <strong>${conversionId}</strong> has been flagged.</p><p>Reason: ${reason}</p><p>Our team will review this shortly.</p>`,
  });
}

export async function sendAffiliateApprovedEmail(to: string, programName: string) {
  if (!isEmailConfigured()) return;
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `VibeAff: You've been approved for ${programName}`,
    html: `<h2>Welcome!</h2><p>You've been approved for the <strong>${programName}</strong> affiliate program.</p><p>Log in to your dashboard to start creating campaigns.</p>`,
  });
}
