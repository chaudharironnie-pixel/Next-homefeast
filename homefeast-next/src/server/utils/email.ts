import nodemailer from 'nodemailer';
import logger from './logger';
import AppError from './AppError';
import ErrorCodes from './errorCodes';

let transporter: nodemailer.Transporter | null = null;
let etherealAccount: nodemailer.TestAccount | null = null;
let isEthereal = false;
let transportMode = 'none';

const isPlaceholder = (val: string | undefined) =>
  !val || val === '' || val === 'undefined' || val.startsWith('<') || /\b(your|example|placeholder|replace)\b/i.test(val);

const isSmtpConfigured = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  return Boolean(host && user && pass && !isPlaceholder(host) && !isPlaceholder(user) && !isPlaceholder(pass));
};

const parsePort = () => {
  const raw = process.env.SMTP_PORT;
  const parsed = Number(raw);
  if (!raw || Number.isNaN(parsed)) return 587;
  return parsed;
};

const buildSmtpTransportOptions = () => {
  const host = process.env.SMTP_HOST!;
  const port = parsePort();
  const user = process.env.SMTP_USER!;
  const pass = process.env.SMTP_PASS!;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const requireTLS = !secure && (port === 587 || port === 2525);
  return {
    host, port, secure, requireTLS,
    auth: { user, pass },
    tls: { rejectUnauthorized: process.env.NODE_ENV === 'production' },
  };
};

const createEtherealTransport = async () => {
  logger.info('Creating Ethereal Email development transport');
  etherealAccount = await nodemailer.createTestAccount();
  isEthereal = true;
  transportMode = 'ethereal';
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email', port: 587, secure: false, requireTLS: true,
    auth: { user: etherealAccount.user, pass: etherealAccount.pass },
  });
};

const createSmtpTransport = () => {
  const opts = buildSmtpTransportOptions();
  isEthereal = false;
  transportMode = 'smtp';
  return nodemailer.createTransport(opts);
};

const createTransport = async () => {
  if (isSmtpConfigured()) return createSmtpTransport();
  if (process.env.USE_ETHEREAL === 'true') return createEtherealTransport();
  throw new AppError(
    'Email transport not configured.',
    503, ErrorCodes.EMAIL_NOT_CONFIGURED
  );
};

const initEmail = async () => {
  try {
    transporter = await createTransport();
  } catch (err) {
    transporter = null;
    transportMode = 'none';
    throw err;
  }
};

const COLORS = {
  primary: '#FF6B35', secondary: '#FFA559', gradientStart: '#FF6B35', gradientEnd: '#FFB703',
  bg: '#FFF8F5', card: '#FFFFFF', text: '#1F2937', muted: '#6B7280', border: '#F3F4F6',
  success: '#10B981', warning: '#F59E0B',
};
const FONTS = "'Poppins', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

const escapeHtml = (str: string | unknown) =>
  String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const formatCurrency = (amount: number | unknown) => {
  const num = Number(amount);
  if (Number.isNaN(num)) return '₹0';
  return `₹${num.toLocaleString('en-IN')}`;
};

const brandStyles = `<style type="text/css">
  body { margin: 0; padding: 0; background-color: ${COLORS.bg}; font-family: ${FONTS}; -webkit-font-smoothing: antialiased; }
  .hf-wrapper { width: 100%; max-width: 600px; margin: 0 auto; background: ${COLORS.card}; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 32px rgba(31,41,55,0.08); }
  .hf-header { background: linear-gradient(135deg, ${COLORS.gradientStart} 0%, ${COLORS.gradientEnd} 100%); padding: 40px 24px; text-align: center; }
  .hf-header h1 { color: #ffffff; margin: 12px 0 0; font-size: 24px; font-weight: 700; }
  .hf-body { padding: 40px 32px; color: ${COLORS.text}; }
  .hf-body p { font-size: 16px; line-height: 1.6; margin: 0 0 16px; }
  .hf-btn { display: inline-block; background: linear-gradient(135deg, ${COLORS.gradientStart} 0%, #F97316 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; }
  .hf-btn-secondary { display: inline-block; background: ${COLORS.bg}; color: ${COLORS.primary}; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: 600; font-size: 15px; border: 1px solid ${COLORS.secondary}; }
  .hf-footer { background: #F9FAFB; padding: 28px 32px; text-align: center; font-size: 13px; color: ${COLORS.muted}; }
  .hf-small { font-size: 13px; color: ${COLORS.muted}; }
  .hf-card { background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 16px; padding: 24px; margin: 16px 0; }
  @media only screen and (max-width: 600px) {
    .hf-body { padding: 28px 20px !important; }
    .hf-header { padding: 32px 20px !important; }
  }
</style>`;

const logoHtml = () => `<table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto;"><tr><td style="width: 52px; height: 52px; background: #ffffff; border-radius: 14px; text-align: center; vertical-align: middle; box-shadow: 0 4px 12px rgba(0,0,0,0.12);"><span style="font-size: 28px; line-height: 1;">🍽️</span></td><td style="padding-left: 14px; vertical-align: middle;"><div style="color: #ffffff; font-size: 22px; font-weight: 800; line-height: 1.1;">HomeFeast</div><div style="color: rgba(255,255,255,0.92); font-size: 10px; font-weight: 600; letter-spacing: 0.6px; text-transform: uppercase;">Homemade Food Delivered</div></td></tr></table>`;

const brandHeader = (title: string) => `<div class="hf-header">${logoHtml()}<h1>${escapeHtml(title)}</h1></div>`;

const brandFooter = () => `<div class="hf-footer"><p style="margin:0 0 10px; font-weight: 700; color: ${COLORS.text}; font-size: 15px;">HomeFeast</p><p style="margin:0 0 10px;">Homemade Food & Tiffin Subscriptions</p><p style="margin:0 0 14px;">Need help? Contact us at <a href="mailto:support@homefeast.com" style="color:${COLORS.primary}; text-decoration:none; font-weight:600;">support@homefeast.com</a></p><p style="margin:0; font-size: 12px; color: #9CA3AF;">© ${new Date().getFullYear()} HomeFeast. This is an automated email, please do not reply.</p></div>`;

const buttonHtml = (url: string, text: string, variant = 'primary') => {
  const style = variant === 'primary'
    ? `background:linear-gradient(135deg, ${COLORS.gradientStart} 0%, #F97316 100%); color:#ffffff;`
    : `background:${COLORS.bg}; color:${COLORS.primary}; border:1px solid ${COLORS.secondary};`;
  return `<table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 28px auto;"><tr><td align="center" style="border-radius: 12px;"><a href="${escapeHtml(url)}" style="display:inline-block; ${style} text-decoration:none; padding:14px 32px; border-radius:12px; font-weight:600; font-size:16px;">${escapeHtml(text)}</a></td></tr></table>`;
};

const otpBox = (otp: string) => {
  const digits = escapeHtml(otp).split('');
  const cells = digits.map(d => `<td style="width: 44px; height: 56px; background: #ffffff; border: 1px solid ${COLORS.secondary}; border-radius: 10px; text-align: center; vertical-align: middle; font-size: 28px; font-weight: 800; color: ${COLORS.primary}; box-shadow: 0 2px 6px rgba(255,107,53,0.12);">${d}</td>`).join('<td style="width: 8px;"></td>');
  return `<table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 8px auto 24px; background: ${COLORS.bg}; border-radius: 16px; padding: 18px;"><tr>${cells}</tr></table>`;
};

const baseTemplate = (title: string, headerTitle: string, bodyHtml: string) => `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${escapeHtml(title)}</title>${brandStyles}</head><body style="margin:0; padding:0; background-color:${COLORS.bg}; font-family:${FONTS};"><table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%" style="background-color:${COLORS.bg}; padding: 24px 0;"><tr><td align="center" valign="top"><div class="hf-wrapper" style="width:100%; max-width:600px; margin:0 auto; background:${COLORS.card}; border-radius:20px; overflow:hidden; box-shadow:0 8px 32px rgba(31,41,55,0.08);">${brandHeader(headerTitle)}<div class="hf-body" style="padding:40px 32px; color:${COLORS.text};">${bodyHtml}</div>${brandFooter()}</div></td></tr></table></body></html>`;

export const emailTemplates = {
  verifyEmail: (otp: string, name = '') => {
    const greeting = name ? `Hi ${escapeHtml(name)},` : 'Hi there,';
    return baseTemplate('Verify your HomeFeast account', 'Verify your email', `<p style="font-size:16px; line-height:1.6; margin:0 0 16px;">${greeting}</p><p style="font-size:16px; line-height:1.6; margin:0 0 22px;">Welcome to <strong style="color:${COLORS.primary};">HomeFeast</strong>! Use the 6-digit verification code below.</p>${otpBox(otp)}<table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%" style="background:${COLORS.bg}; border-radius:12px; margin:0 0 22px;"><tr><td style="padding:16px 20px;"><p style="margin:0 0 8px; font-size:14px; color:${COLORS.muted};">Expires in <strong style="color:${COLORS.text};">10 minutes</strong></p></td></tr></table>`);
  },
  resetPassword: (url: string, name = '') => {
    const greeting = name ? `Hi ${escapeHtml(name)},` : 'Hi there,';
    return baseTemplate('Reset your HomeFeast password', 'Reset your password', `<p style="font-size:16px; line-height:1.6; margin:0 0 16px;">${greeting}</p><p style="font-size:16px; line-height:1.6; margin:0 0 24px;">We received a request to reset your password. This link is valid for <strong>10 minutes</strong>.</p>${buttonHtml(url, 'Reset Password')}<p class="hf-small" style="font-size:13px; color:${COLORS.muted}; margin:0;">If you didn't request a password reset, you can safely ignore this email.</p>`);
  },
  welcome: (name = '') => {
    const greeting = name ? `Hi ${escapeHtml(name)},` : 'Hi there,';
    const exploreUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/explore`;
    return baseTemplate('Welcome to HomeFeast', 'Welcome aboard', `<p style="font-size:16px; line-height:1.6; margin:0 0 16px;">${greeting}</p><p style="font-size:16px; line-height:1.6; margin:0 0 24px;">Your email is verified and your account is ready.</p>${buttonHtml(exploreUrl, 'Explore Food Now')}`);
  },
  orderConfirmed: (order: Record<string, unknown>, name = '') => {
    const greeting = name ? `Hi ${escapeHtml(name)},` : 'Hi there,';
    const orderNum = (order.orderNumber || order.id) as string;
    return baseTemplate('Your order is confirmed', 'Order confirmed', `<p style="font-size:16px; line-height:1.6; margin:0 0 16px;">${greeting}</p><p style="font-size:16px; line-height:1.6; margin:0 0 20px;">Thank you for ordering with <strong style="color:${COLORS.primary};">HomeFeast</strong>.</p><div style="text-align:center; margin:0 0 24px;"><span style="display:inline-block; padding:6px 14px; border-radius:999px; background:${COLORS.primary}20; color:${COLORS.primary}; font-weight:700; font-size:13px;">${escapeHtml(order.status as string || 'confirmed')}</span></div><table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%" style="background:${COLORS.bg}; border-radius:16px; margin:0 0 24px;"><tr><td style="padding:20px 24px;"><p style="margin:0 0 6px; font-size:13px; color:${COLORS.muted}; text-transform:uppercase; letter-spacing:0.5px;">Order Number</p><p style="margin:0; font-size:22px; font-weight:800; color:${COLORS.primary};">#${escapeHtml(orderNum)}</p></td></tr></table>`);
  },
  orderAccepted: (orderNum: string, name = '') => {
    const greeting = name ? `Hi ${escapeHtml(name)},` : 'Hi there,';
    return baseTemplate('Your order has been accepted', 'Order accepted', `<p style="font-size:16px; line-height:1.6; margin:0 0 16px;">${greeting}</p><p style="font-size:16px; line-height:1.6; margin:0 0 24px;">Your order <strong style="color:${COLORS.primary};">#${escapeHtml(orderNum)}</strong> has been accepted and is being prepared.</p>`);
  },
  subscriptionExpiring: (date: string, name = '') => {
    const greeting = name ? `Hi ${escapeHtml(name)},` : 'Hi there,';
    const renewUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/customer/subscriptions`;
    return baseTemplate('Your subscription is expiring', 'Subscription expiring soon', `<p style="font-size:16px; line-height:1.6; margin:0 0 16px;">${greeting}</p><p style="font-size:16px; line-height:1.6; margin:0 0 24px;">Your subscription expires on <strong style="color:${COLORS.primary};">${escapeHtml(date)}</strong>.</p>${buttonHtml(renewUrl, 'Renew Subscription')}`);
  },
  contactSupport: ({ name, email: emailAddr, subject, message }: { name: string; email: string; subject: string; message: string }) => {
    return baseTemplate('New support request', 'Support request', `<p style="font-size:16px; line-height:1.6; margin:0 0 20px;">A new support request has been received.</p><div class="hf-card" style="background:${COLORS.card}; border:1px solid ${COLORS.border}; border-radius:16px; padding:24px; margin:0 0 24px;"><table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%" style="font-size:15px; color:${COLORS.text};"><tr><td style="padding:8px 0; color:${COLORS.muted}; width:120px;">Name</td><td style="padding:8px 0; font-weight:600;">${escapeHtml(name)}</td></tr><tr><td style="padding:8px 0; color:${COLORS.muted};">Email</td><td style="padding:8px 0; font-weight:600;">${escapeHtml(emailAddr)}</td></tr><tr><td style="padding:8px 0; color:${COLORS.muted};">Subject</td><td style="padding:8px 0; font-weight:600;">${escapeHtml(subject)}</td></tr><tr><td colspan="2" style="padding:14px; background:${COLORS.bg}; border-radius:10px; line-height:1.6;">${escapeHtml(message).replace(/\n/g, '<br />')}</td></tr></table></div>`);
  },
};

const buildFrom = () => {
  const name = process.env.SMTP_FROM_NAME || 'HomeFeast';
  const email = process.env.SMTP_FROM_EMAIL;
  if (email) return name === email ? email : { name, address: email };
  return process.env.SMTP_USER;
};

export const sendEmail = async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
  if (!transporter) await initEmail();
  if (!transporter) throw new AppError('Email service unavailable', 503, ErrorCodes.EMAIL_SEND_FAILED);

  const from = buildFrom();
  const info = await transporter.sendMail({ from, to, subject, html });
  const previewUrl = isEthereal ? nodemailer.getTestMessageUrl(info) : null;
  return { info, previewUrl };
};

export const initEmailTransport = initEmail;
