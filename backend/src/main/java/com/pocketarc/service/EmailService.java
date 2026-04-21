package com.pocketarc.service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final Resend resend;
    private final String fromEmail;
    private final boolean configured;

    public EmailService(
            @Value("${resend.api-key:}") String apiKey,
            @Value("${resend.from-email}") String fromEmail) {
        this.fromEmail = fromEmail;
        this.configured = apiKey != null && !apiKey.isBlank() && !apiKey.equals("your_resend_api_key");
        this.resend = configured ? new Resend(apiKey) : null;
    }

    public void sendOtpEmail(String toEmail, String username, String code) {
        if (!configured) {
            return;
        }

        try {
            CreateEmailOptions options = CreateEmailOptions.builder()
                    .from(fromEmail)
                    .to(toEmail)
                    .subject("PocketArc – Your Verification Code")
                    .html(buildHtml(username, code))
                    .build();

            resend.emails().send(options);

        } catch (ResendException e) {
            throw new RuntimeException("Failed to send verification email. Please try again.");
        }
    }

    private String buildHtml(String username, String code) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin:0;padding:0;background:#f8f6f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
                <tr>
                  <td align="center">
                    <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
                      <tr>
                        <td style="background:#0a0a0a;padding:24px;text-align:center;">
                          <h1 style="color:#fff;margin:0;font-size:24px;font-weight:500;letter-spacing:0.02em;">
                            PocketArc
                          </h1>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:36px 40px;">
                          <p style="font-size:15px;color:#444;margin:0 0 16px;">
                            Hi <strong>%s</strong>,
                          </p>
                          <p style="font-size:15px;color:#444;margin:0 0 24px;">
                            Your verification code is:
                          </p>
                          <div style="text-align:center;margin:0 0 24px;">
                            <div style="display:inline-block;font-size:34px;font-weight:600;letter-spacing:10px;background:#f8f6f1;padding:16px 28px;border-radius:8px;font-family:monospace;color:#08060d;">
                              %s
                            </div>
                          </div>
                          <p style="font-size:13px;color:#888;margin:0 0 8px;">
                            This code expires in <strong>15 minutes</strong>.
                          </p>
                          <p style="font-size:13px;color:#888;margin:0 0 28px;">
                            If you didn't request this, you can safely ignore this email.
                          </p>
                          <hr style="border:none;border-top:1px solid #e5e3de;margin:0 0 20px;">
                          <p style="font-size:12px;color:#bbb;text-align:center;margin:0;">
                            PocketArc · Financial Literacy Platform
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(username, code);
    }
}