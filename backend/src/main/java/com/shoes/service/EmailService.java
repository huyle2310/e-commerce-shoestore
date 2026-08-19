package com.shoes.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired
    private com.shoes.repository.OrderRepository orderRepository;

    @Async
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public void sendOrderConfirmation(String to, com.shoes.entity.Order detachedOrder) {
        com.shoes.entity.Order order = orderRepository.findById(detachedOrder.getId()).orElse(detachedOrder);
        
        if (mailSender == null) {
            System.out.println("EmailService: mailSender is null. Simulated sending email to " + to);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject("Xác nhận đơn hàng #" + order.getId().toString().substring(0, 8).toUpperCase()
                    + " tại VANGUARD SHOE STORE");

            StringBuilder itemsHtml = new StringBuilder();
            itemsHtml.append("<table style='width: 100%; border-collapse: collapse; margin-top: 15px;'>");
            itemsHtml.append(
                    "<tr><th style='border-bottom: 1px solid #ddd; padding: 8px; text-align: left;'>Sản phẩm</th><th style='border-bottom: 1px solid #ddd; padding: 8px; text-align: center;'>SL</th><th style='border-bottom: 1px solid #ddd; padding: 8px; text-align: right;'>Thành tiền</th></tr>");

            for (com.shoes.entity.OrderItem item : order.getItems()) {
                String productName = item.getVariant().getProduct().getNameVi() + " - " + item.getVariant().getColorVi()
                        + " (Size " + item.getVariant().getSize() + ")";
                itemsHtml.append("<tr>")
                        .append("<td style='border-bottom: 1px solid #eee; padding: 8px;'>").append(productName)
                        .append("</td>")
                        .append("<td style='border-bottom: 1px solid #eee; padding: 8px; text-align: center;'>")
                        .append(item.getQuantity()).append("</td>")
                        .append("<td style='border-bottom: 1px solid #eee; padding: 8px; text-align: right;'>")
                        .append(new java.text.DecimalFormat("#,###").format(item.getTotalPrice())).append(" đ</td>")
                        .append("</tr>");
            }
            itemsHtml.append("</table>");

            String htmlMsg = "<div style='font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto;'>"
                    + "<h2 style='color: #f97316; text-align: center;'>Cảm ơn bạn đã mua sắm tại VANGUARD SHOE STORE!</h2>"
                    + "<p>Xin chào <strong>" + order.getFullName() + "</strong>,</p>"
                    + "<p>Đơn hàng của bạn đã được tiếp nhận và đang trong quá trình xử lý.</p>"
                    + "<div style='background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;'>"
                    + "<p style='margin: 0 0 10px 0;'><strong>Mã đơn hàng:</strong> #"
                    + order.getId().toString().substring(0, 8).toUpperCase() + "</p>"
                    + "<p style='margin: 0 0 10px 0;'><strong>Tên đơn hàng:</strong> #"
                    + order.getFullName() + "</p>"
                    + "<p style='margin: 0 0 10px 0;'><strong>Tổng thanh toán:</strong> <span style='color: #f97316; font-weight: bold; font-size: 16px;'>"
                    + new java.text.DecimalFormat("#,###").format(order.getFinalAmount()) + " đ</span></p>"
                    + "<p style='margin: 0 0 15px 0;'><strong>Địa chỉ giao hàng:</strong> " + order.getShippingAddress()
                    + "</p>"
                    + "<h3 style='border-bottom: 2px solid #ddd; padding-bottom: 5px; margin-bottom: 10px;'>Chi tiết sản phẩm</h3>"
                    + itemsHtml.toString()
                    + "</div>"
                    + "<p>Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất để giao hàng.</p>"
                    + "<p>Trân trọng,<br>Đội ngũ VANGUARD SHOE STORE</p>"
                    + "</div>";

            helper.setText(htmlMsg, true);
            mailSender.send(message);

            System.out.println("Email sent successfully to " + to);
        } catch (MessagingException e) {
            System.err.println("Failed to send email to " + to);
            e.printStackTrace();
        }
    }

    @Async
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public void sendOrderCancellationEmail(String to, com.shoes.entity.Order detachedOrder, String reason) {
        com.shoes.entity.Order order = orderRepository.findById(detachedOrder.getId()).orElse(detachedOrder);
        
        if (mailSender == null) {
            System.out.println("EmailService: mailSender is null. Simulated sending cancellation email to " + to);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject("Thông báo hủy đơn hàng #" + order.getId().toString().substring(0, 8).toUpperCase()
                    + " tại VANGUARD SHOE STORE");

            StringBuilder itemsHtml = new StringBuilder();
            itemsHtml.append("<table style='width: 100%; border-collapse: collapse; margin-top: 15px;'>");
            itemsHtml.append(
                    "<tr><th style='border-bottom: 1px solid #ddd; padding: 8px; text-align: left;'>Sản phẩm</th><th style='border-bottom: 1px solid #ddd; padding: 8px; text-align: center;'>SL</th><th style='border-bottom: 1px solid #ddd; padding: 8px; text-align: right;'>Thành tiền</th></tr>");

            for (com.shoes.entity.OrderItem item : order.getItems()) {
                String productName = item.getVariant().getProduct().getNameVi() + " - " + item.getVariant().getColorVi()
                        + " (Size " + item.getVariant().getSize() + ")";
                itemsHtml.append("<tr>")
                        .append("<td style='border-bottom: 1px solid #eee; padding: 8px;'>").append(productName)
                        .append("</td>")
                        .append("<td style='border-bottom: 1px solid #eee; padding: 8px; text-align: center;'>")
                        .append(item.getQuantity()).append("</td>")
                        .append("<td style='border-bottom: 1px solid #eee; padding: 8px; text-align: right;'>")
                        .append(new java.text.DecimalFormat("#,###").format(item.getTotalPrice())).append(" đ</td>")
                        .append("</tr>");
            }
            itemsHtml.append("</table>");

            String paymentNotice = "";
            if ("PAID".equals(order.getPaymentStatus())) {
                paymentNotice = "<div style='background-color: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin-top: 15px; border-left: 5px solid #ffeeba;'>"
                              + "<strong>Lưu ý về hoàn tiền:</strong> Đơn hàng của bạn đã được thanh toán. Chúng tôi sẽ tiến hành thủ tục hoàn tiền cho bạn trong thời gian sớm nhất. Vui lòng liên hệ với bộ phận chăm sóc khách hàng qua Fanpage hoặc Hotline và cung cấp số tài khoản ngân hàng để nhận lại tiền."
                              + "</div>";
            }

            String htmlMsg = "<div style='font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto;'>"
                    + "<h2 style='color: #dc3545; text-align: center;'>Thông báo hủy đơn hàng</h2>"
                    + "<p>Xin chào <strong>" + order.getFullName() + "</strong>,</p>"
                    + "<p>Đơn hàng của bạn đã bị hủy.</p>"
                    + (reason != null && !reason.isEmpty() ? "<p><strong>Lý do:</strong> " + reason + "</p>" : "")
                    + paymentNotice
                    + "<div style='background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;'>"
                    + "<p style='margin: 0 0 10px 0;'><strong>Mã đơn hàng:</strong> #"
                    + order.getId().toString().substring(0, 8).toUpperCase() + "</p>"
                    + "<p style='margin: 0 0 10px 0;'><strong>Tổng thanh toán:</strong> <span style='color: #dc3545; font-weight: bold; font-size: 16px;'>"
                    + new java.text.DecimalFormat("#,###").format(order.getFinalAmount()) + " đ</span></p>"
                    + "<h3 style='border-bottom: 2px solid #ddd; padding-bottom: 5px; margin-bottom: 10px;'>Chi tiết sản phẩm</h3>"
                    + itemsHtml.toString()
                    + "</div>"
                    + "<p>Nếu bạn có bất kỳ thắc mắc nào, xin vui lòng liên hệ với chúng tôi.</p>"
                    + "<p>Trân trọng,<br>Đội ngũ VANGUARD SHOE STORE</p>"
                    + "</div>";

            helper.setText(htmlMsg, true);
            mailSender.send(message);

            System.out.println("Cancellation email sent successfully to " + to);
        } catch (MessagingException e) {
            System.err.println("Failed to send cancellation email to " + to);
            e.printStackTrace();
        }
    }

    @Async
    public void sendResetPasswordEmail(String toEmail, String code) {
        if (mailSender == null) {
            System.out.println("EmailService: mailSender is null. Simulated sending reset code " + code + " to " + toEmail);
            return;
        }

        try {
            org.springframework.mail.SimpleMailMessage message = new org.springframework.mail.SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Vanguard Shoe Store - Mã Khôi Phục Mật Khẩu");
            message.setText("Xin chào,\n\n"
                    + "Bạn đã yêu cầu khôi phục mật khẩu. Dưới đây là mã xác nhận của bạn:\n\n"
                    + "Mã xác nhận: " + code + "\n\n"
                    + "Mã này có hiệu lực trong 15 phút.\n"
                    + "Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này.\n\n"
                    + "Trân trọng,\nVanguard Shoe Store");

            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send reset password email to " + toEmail);
            e.printStackTrace();
        }
    }

    @Async
    public void sendEmailChangeOtp(String toEmail, String code) {
        if (mailSender == null) {
            System.out.println("EmailService: mailSender is null. Simulated sending email change OTP " + code + " to " + toEmail);
            return;
        }

        try {
            org.springframework.mail.SimpleMailMessage message = new org.springframework.mail.SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Vanguard Shoe Store - Xác nhận thay đổi địa chỉ email");
            message.setText("Xin chào,\n\n"
                    + "Bạn đã yêu cầu thay đổi địa chỉ email cho tài khoản của mình. Dưới đây là mã xác nhận (OTP) của bạn:\n\n"
                    + "Mã xác nhận: " + code + "\n\n"
                    + "Mã này có hiệu lực trong 15 phút.\n"
                    + "Nếu bạn không yêu cầu thay đổi email, vui lòng bỏ qua email này.\n\n"
                    + "Trân trọng,\nVanguard Shoe Store");

            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send email change OTP to " + toEmail);
            e.printStackTrace();
        }
    }

    @Async
    public void sendRegistrationOtp(String toEmail, String code) {
        if (mailSender == null) {
            System.out.println("EmailService: mailSender is null. Simulated sending registration OTP " + code + " to " + toEmail);
            return;
        }

        try {
            org.springframework.mail.SimpleMailMessage message = new org.springframework.mail.SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Vanguard Shoe Store - Mã Xác Nhận Đăng Ký Tài Khoản");
            message.setText("Xin chào,\n\n"
                    + "Cảm ơn bạn đã đăng ký tài khoản tại Vanguard Shoe Store. Dưới đây là mã xác nhận (OTP) của bạn:\n\n"
                    + "Mã xác nhận: " + code + "\n\n"
                    + "Mã này có hiệu lực trong 15 phút.\n"
                    + "Nếu bạn không thực hiện đăng ký, vui lòng bỏ qua email này.\n\n"
                    + "Trân trọng,\nVanguard Shoe Store");

            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send registration OTP to " + toEmail);
            e.printStackTrace();
        }
    }
}
