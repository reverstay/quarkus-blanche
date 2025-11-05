package org.neuverse.service;

import io.quarkus.mailer.Mail;
import io.quarkus.mailer.Mailer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.neuverse.entity.PasswordToken;
import org.neuverse.entity.Usuario;
import org.neuverse.entity.PasswordToken.Purpose;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Base64;

@ApplicationScoped
public class PasswordInviteService {

    @Inject Mailer mailer;

    private static final SecureRandom RNG = new SecureRandom();

    private String newOpaqueToken() {
        byte[] b = new byte[32];
        RNG.nextBytes(b);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }

    private byte[] sha256(String token) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        return md.digest(token.getBytes(StandardCharsets.UTF_8));
    }

    /** Cria token (INVITE/RESET), persiste hash e envia e-mail com link. */
    @Transactional
    public void sendInviteOrReset(Usuario user, Purpose purpose, String appBaseUrl, long ttlHours) {
        try {
            String token = newOpaqueToken();
            byte[] hash = sha256(token);

            PasswordToken pt = new PasswordToken();
            pt.userId = user.id;
            pt.purpose = purpose;
            pt.tokenHash = hash;
            pt.expiresAt = OffsetDateTime.now().plus(ttlHours, ChronoUnit.HOURS);
            pt.persist();

            String qsToken = URLEncoder.encode(token, StandardCharsets.UTF_8);
            String base = appBaseUrl.replaceAll("/+$", "");
            String link = base + "/definir-senha?token=" + qsToken;

            String subject = purpose == Purpose.INVITE
                    ? "Bem-vindo! Defina sua senha"
                    : "Redefinição de senha";
            String html = """
                <p>Olá%s,</p>
                <p>%s sua senha clicando no botão abaixo (expira em %d horas):</p>
                <p><a href="%s" style="background:#0B1220;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Definir senha</a></p>
                <p>Se o botão não funcionar, copie e cole este link no navegador:<br>%s</p>
                """.formatted(
                    user.nome != null ? " " + user.nome : "",
                    purpose == Purpose.INVITE ? "Defina" : "Redefina",
                    ttlHours, link, link
                );

            mailer.send(Mail.withHtml(user.email, subject, html));
        } catch (Exception e) {
            throw new RuntimeException("Falha ao enviar convite/reset: " + e.getMessage(), e);
        }
    }

    /** Valida token; retorna o usuário e marca uso (invalida). */
    @Transactional
    public Usuario consumeTokenAndReturnUser(String token) {
        try {
            byte[] hash = sha256(token);
            PasswordToken pt = PasswordToken.find("tokenHash = ?1 and usedAt is null", hash).firstResult();
            if (pt == null) throw new IllegalArgumentException("Token inválido.");
            if (pt.expiresAt.isBefore(OffsetDateTime.now()))
                throw new IllegalArgumentException("Token expirado.");

            Usuario user = Usuario.findById(pt.userId);
            if (user == null) throw new IllegalArgumentException("Usuário não encontrado.");

            pt.usedAt = OffsetDateTime.now(); // invalida
            return user;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Erro ao validar token: " + e.getMessage(), e);
        }
    }
}
