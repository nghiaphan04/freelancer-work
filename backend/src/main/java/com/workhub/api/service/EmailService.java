package com.workhub.api.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async
    public void sendOtpEmail(String toEmail, String fullName, String otpCode, String purpose) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(getSubject(purpose));
            helper.setText(buildEmailHtml(fullName, otpCode, purpose), true);

            mailSender.send(message);
            log.info("OTP email sent to: {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage());
        }
    }

    private String getSubject(String purpose) {
        return switch (purpose) {
            case "REGISTRATION" -> "Xác thực tài khoản - Freelancer";
            case "FORGOT_PASSWORD" -> "Đặt lại mật khẩu - Freelancer";
            default -> "Mã OTP - Freelancer";
        };
    }

    private String buildEmailHtml(String fullName, String otpCode, String purpose) {
        String purposeText = purpose.equals("REGISTRATION") ? "xác thực tài khoản" : "đặt lại mật khẩu";
        return """
           <div style="font-family:Arial, Helvetica, sans-serif;
            max-width:400px;
            margin:0 auto;
            padding:20px;
            border:1px solid #e0e0e0;
            border-radius:8px;
            color:#202124;">

            <h2 style="font-size:18px;
                    font-weight:500;
                    text-align:left;
                    margin:0 0 16px 0;
                    color:#202124;">
                Freelancer
            </h2>

            <p style="font-size:14px; margin:0 0 12px 0;">
                Xin chào <strong>%s</strong>,
            </p>

            <p style="font-size:14px; margin:0 0 12px 0;">
                Chúng tôi nhận được yêu cầu <strong>%s</strong> tài khoản của bạn.
            </p>

            <p style="font-size:14px; margin:0 0 8px 0;">
                Mã xác minh của bạn là:
            </p>

            <div style="font-size:28px;
                        font-weight:500;
                        letter-spacing:6px;
                        margin:12px 0 20px 0;">
                %s
            </div>

            <p style="font-size:13px;
                    color:#5f6368;
                    margin:0 0 16px 0;">
                Mã này sẽ hết hạn sau <strong>10 phút</strong>.
            </p>

            <p style="font-size:13px;
                    color:#5f6368;
                    margin:0 0 24px 0;">
                Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.
            </p>

            <hr style="border:none;
                    border-top:1px solid #e0e0e0;
                    margin:24px 0;">

            <p style="color:#80868b;
                    font-size:12px;
                    margin:0;
                    text-align:left;">
                © 2026 Freelancer
            </p>
        </div>

            """.formatted(fullName, purposeText, otpCode);
    }
}
