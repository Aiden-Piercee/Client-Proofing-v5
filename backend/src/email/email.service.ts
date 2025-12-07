import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import { Attachment } from 'nodemailer/lib/mailer';

export interface MagicLinkContext {
  email: string;
  clientName?: string;
  albumTitle?: string;
  link: string;
}

export interface EditedNotificationContext {
  email: string;
  originalId: number;
  editedId: number;
  albumTitle?: string;
}

export interface EditedAlbumDigestContext {
  email: string;
  clientName?: string | null;
  albumTitle?: string | null;
  sessionLinks: string[];
  landingLink?: string;
  previews?: PreviewAttachment[];
}

export interface PreviewAttachment {
  filename: string;
  path?: string;
  content?: string;
}

export interface ThankYouContext {
  email: string;
  clientName?: string | null;
  albumTitle?: string | null;
  previews?: PreviewAttachment[];
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(configService: ConfigService) {
    const mailer =
      (nodemailer as typeof import('nodemailer') | undefined) ??
      // Fallback for environments where the default import is undefined
      (require('nodemailer') as typeof import('nodemailer'));

    if (!mailer || !mailer.createTransport) {
      throw new Error('Nodemailer is not available to create a transport');
    }

    const host = configService.get<string>('SMTP_HOST');
    const port = Number(configService.get<string>('SMTP_PORT') ?? 587);
    const user = configService.get<string>('SMTP_USER');
    const pass = configService.get<string>('SMTP_PASS');
    const allowSelfSigned =
      `${configService.get<string>('SMTP_ALLOW_SELF_SIGNED') ?? ''}`.toLowerCase() ===
      'true';

    this.from =
      configService.get<string>('SMTP_FROM') ??
      'no-reply@clientproofing.local';

    this.transporter = mailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
      tls: allowSelfSigned
        ? {
            rejectUnauthorized: false,
          }
        : undefined,
    });
  }

  async sendMagicLink(context: MagicLinkContext) {
    const body =
      `Hello ${context.clientName ?? 'there'},\n\n` +
      `You can access your ${context.albumTitle ?? 'album'} proofing gallery using the link below:\n` +
      `${context.link}\n\n` +
      `This link is unique to your email address and will expire automatically.`;

    await this.sendEmail({
      to: context.email,
      subject: 'Your proofing link',
      text: body,
    });
  }

  async sendEditedNotification(context: EditedNotificationContext) {
    const lines = [
      `New edited photo available for ${context.albumTitle ?? 'your album'}.`,
      `Original image ID: ${context.originalId}.`,
      `Edited image ID: ${context.editedId}.`,
      '',
      'Visit your proofing link to view the updated image.',
    ];

    await this.sendEmail({
      to: context.email,
      subject: 'Edited photo available',
      text: lines.join('\n'),
    });
  }

  async sendEditedAlbumDigest(context: EditedAlbumDigestContext) {
    const header =
      `Hello ${context.clientName ?? 'there'},` +
      `\n\n` +
      `Edited photos are now available for ${context.albumTitle ?? 'your gallery'}.`;

    const links = context.sessionLinks.map((link, idx) => `  ${idx + 1}. ${link}`);

    const landing = context.landingLink
      ? [``, `Landing page: ${context.landingLink}`]
      : [];

    const attachments = this.normalizeAttachments(context.previews);

    const body = [
      header,
      '',
      'Use your magic link(s) below to view the new edits:',
      ...links,
      ...landing,
      '',
      'These were sent after no new edits were detected for 30 minutes — the reminder promised in your thank-you note.',
    ].join('\n');

    await this.sendEmail({
      to: context.email,
      subject: 'Edited photos are ready to review',
      text: body,
      attachments,
    });
  }

  async sendThankYouForEmailCapture(context: ThankYouContext) {
    const greeting = `Hello ${context.clientName ?? 'there'},\n\n`;
    const intro =
      `Thank you for sharing your email for ${context.albumTitle ?? 'your gallery'}. ` +
      `We will notify you as soon as your edited photos are completed and ready for download.`;
    const previewLine = context.previews?.length
      ? '\n\nWe have attached a few filenames and thumbnails as a quick preview.'
      : '';
    const roadmap =
      '\n\nWhat happens next:\n' +
      '- We finish polishing your edits.\n' +
      '- Our system watches for new edits and, after 30 quiet minutes, sends a reminder with links.\n' +
      '- You will get a final note when everything is ready to review and download.';
    const closing = '\n\nYou will receive an update after editing finishes (including the 30-minute checks).';

    const attachments = this.normalizeAttachments(context.previews);

    await this.sendEmail({
      to: context.email,
      subject: 'Thank you – we will notify you when edits are ready',
      text: `${greeting}${intro}${previewLine}${roadmap}${closing}`,
      attachments,
    });
  }

  private async sendEmail(options: {
    to: string;
    subject: string;
    text: string;
    attachments?: Attachment[];
  }) {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        attachments: options.attachments,
      });
      this.logger.log(`Sent email to ${options.to}: ${options.subject}`);
    } catch (err) {
      this.logger.error(`Failed sending email to ${options.to}`, err as Error);
      throw err;
    }
  }

  private normalizeAttachments(
    previews?: PreviewAttachment[],
  ): Attachment[] | undefined {
    if (!previews || previews.length === 0) {
      return undefined;
    }

    return previews
      .filter((preview) => preview.filename && (preview.path || preview.content))
      .map<Attachment>((preview) => ({
        filename: preview.filename,
        path: preview.path ?? undefined,
        content: preview.content,
      }));
  }
}
