import fp from 'fastify-plugin';
import { Resend } from 'resend';
import type { FastifyInstance } from 'fastify';

interface MailOptions {
  from?: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

interface MailSender {
  sendMail(opts: MailOptions): Promise<{ messageId?: string }>;
}

declare module 'fastify' {
  interface FastifyInstance {
    mailer: MailSender;
  }
}

async function plugin(app: FastifyInstance) {
  const apiKey = process.env.RESEND_API_KEY;
  const defaultFrom = process.env.SMTP_FROM ?? 'ReviewBD <noreply@reviewbd.com>';

  let mailer: MailSender;

  if (apiKey) {
    const resend = new Resend(apiKey);
    mailer = {
      async sendMail(opts) {
        const payload: Parameters<typeof resend.emails.send>[0] = {
          from: opts.from ?? defaultFrom,
          to: opts.to,
          subject: opts.subject,
          ...(opts.html ? { html: opts.html } : {}),
          ...(opts.text ? { text: opts.text } : { text: opts.subject }),
        };
        const { data, error } = await resend.emails.send(payload);
        if (error) throw new Error(error.message);
        return { messageId: data?.id };
      },
    };
  } else {
    // Dev fallback: log emails to console instead of sending
    app.log.warn('RESEND_API_KEY not set — emails will be logged to console only');
    mailer = {
      async sendMail(opts) {
        app.log.info({ to: opts.to, subject: opts.subject }, '[DEV EMAIL]');
        return {};
      },
    };
  }

  app.decorate('mailer', mailer);
}

export const mailerPlugin = fp(plugin, { name: 'mailer' });
