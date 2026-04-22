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
        StringBuilder html = new StringBuilder();

        html.append("<!DOCTYPE html>\n");
        html.append("<html lang=\"en\">\n");
        html.append("<head>\n");
        html.append("  <meta charset=\"UTF-8\">\n");
        html.append("  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n");
        html.append("</head>\n");
        html.append("<body style=\"margin:0;padding:0;background:#f8f6f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;\">\n");
        html.append("  <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"padding:40px 20px;\">\n");
        html.append("    <tr>\n");
        html.append("      <td align=\"center\">\n");
        html.append("        <table width=\"480\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);\">\n");
        html.append("          <tr>\n");
        html.append("            <td style=\"background:#0a0a0a;padding:24px;text-align:center;\">\n");
        html.append("              <h1 style=\"color:#fff;margin:0;font-size:24px;font-weight:500;letter-spacing:0.02em;\">\n");
        html.append("                PocketArc\n");
        html.append("              </h1>\n");
        html.append("            </td>\n");
        html.append("           </tr>\n");
        html.append("           <tr>\n");
        html.append("            <td style=\"padding:36px 40px;\">\n");
        html.append("              <p style=\"font-size:15px;color:#444;margin:0 0 16px;\">\n");
        html.append("                Hi <strong>").append(username).append("</strong>,\n");
        html.append("              </p>\n");
        html.append("              <p style=\"font-size:15px;color:#444;margin:0 0 24px;\">\n");
        html.append("                Your verification code is:\n");
        html.append("              </p>\n");
        html.append("              <div style=\"text-align:center;margin:0 0 24px;\">\n");
        html.append("                <div style=\"display:inline-block;font-size:34px;font-weight:600;letter-spacing:10px;background:#f8f6f1;padding:16px 28px;border-radius:8px;font-family:monospace;color:#08060d;\">\n");
        html.append("                  ").append(code).append("\n");
        html.append("                </div>\n");
        html.append("              </div>\n");
        html.append("              <p style=\"font-size:13px;color:#888;margin:0 0 8px;\">\n");
        html.append("                This code expires in <strong>15 minutes</strong>.\n");
        html.append("              </p>\n");
        html.append("              <p style=\"font-size:13px;color:#888;margin:0 0 28px;\">\n");
        html.append("                If you didn't request this, you can safely ignore this email.\n");
        html.append("              </p>\n");
        html.append("              <hr style=\"border:none;border-top:1px solid #e5e3de;margin:0 0 20px;\">\n");
        html.append("              <p style=\"font-size:12px;color:#bbb;text-align:center;margin:0;\">\n");
        html.append("                PocketArc · Financial Literacy Platform\n");
        html.append("              </p>\n");
        html.append("            </td>\n");
        html.append("           </tr>\n");
        html.append("         </table>\n");
        html.append("       </td>\n");
        html.append("     </tr>\n");
        html.append("  </table>\n");
        html.append("</body>\n");
        html.append("</html>");

        return html.toString();
    }
}