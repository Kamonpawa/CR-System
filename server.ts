import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // API Route to send emails
  app.post('/api/send-email', async (req, res) => {
    const { to, subject, htmlBody } = req.body;

    if (!to || !subject || !htmlBody) {
      return res.status(400).json({ error: 'Missing to, subject, or htmlBody' });
    }

    try {
      let transporter;
      let isSimulated = false;
      let etherealUrl: string | boolean = false;

      const host = process.env.SMTP_HOST;
      const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;
      const from = process.env.SMTP_FROM || user || 'change-request-system@rapid-involution.com';

      if (host && user && pass) {
        // Use user-provided real SMTP
        transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
        });
      } else {
        // In development / absence of credentials, use Ethereal auto-generated test accounts
        try {
          const testAccount = await nodemailer.createTestAccount();
          transporter = nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass,
            },
          });
          isSimulated = true;
        } catch (etherealErr) {
          console.error('Failed to create Ethereal SMTP test account:', etherealErr);
          return res.json({
            success: true,
            status: 'logged_offline',
            message: 'SMTP not configured and Ethereal generation failed. Email logged to server console.',
            details: { to, subject, htmlBody }
          });
        }
      }

      const info = await transporter.sendMail({
        from: host && user && pass ? from : `"Change Request System" <${transporter.options.auth?.user || 'noreply@example.com'}>`,
        to,
        subject,
        html: htmlBody,
      });

      if (isSimulated) {
        etherealUrl = nodemailer.getTestMessageUrl(info);
        console.log(`[Email Sent via Ethereal] View at: ${etherealUrl}`);
      }

      return res.json({
        success: true,
        messageId: info.messageId,
        isSimulated,
        previewUrl: etherealUrl,
        message: isSimulated 
          ? 'Email sent successfully via Ethereal test server. Click the preview link to view it!' 
          : 'Email sent successfully via configured SMTP server.'
      });
    } catch (err: any) {
      console.error('Error sending email:', err);
      return res.status(500).json({ error: 'Failed to send email', details: err.message });
    }
  });

  // Serve static files / Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
