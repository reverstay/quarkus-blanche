package org.neuverse.resource;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import io.quarkus.security.identity.SecurityIdentity;

import org.mindrot.jbcrypt.BCrypt;
import org.neuverse.entity.Usuario;
import org.neuverse.entity.PasswordToken.Purpose;
import org.neuverse.service.JwtService;
import org.neuverse.service.PasswordInviteService;
import org.neuverse.service.TotpService;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Path("/auth")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject PasswordInviteService invites;
    @Inject JwtService jwt;
    @Inject TotpService totp;

    // Injeção do usuário atual (via JWT)
    @Inject SecurityIdentity identity;

    // Headers da requisição (para ler X-User-Email no 2FA)
    @Context HttpHeaders httpHeaders;

    // -------------------- DTOs --------------------
    public static class InviteDTO { public String email; public String nome; public String baseUrl; }
    public static class ResetRequestDTO { public String email; public String baseUrl; }
    public static class SetPasswordDTO { public String token; public String newPassword; }
    public static class LoginDTO { public String email; public String password; }
    public static class TwoFaDTO { public String code; public String session; }
    public static class TwoFaSetupDTO { public String baseUrl; } // opcional
    public static class Disable2FADTO { public String code; }

    // ---------------- Convite e Reset ----------------
    @POST @Path("/invite")
    @Transactional
    public Response invite(InviteDTO dto) {
        if (dto == null || dto.email == null || dto.email.isBlank() || dto.baseUrl == null)
            throw new BadRequestException("email e baseUrl são obrigatórios.");

        Usuario u = Usuario.findByEmail(dto.email);
        if (u == null) {
            u = new Usuario();
            u.id = UUID.randomUUID();
            u.email = dto.email;
            u.nome = dto.nome;
            u.online = Boolean.FALSE;
            // Campos opcionais na sua entidade:
            // emailVerificado / twoFactorEnabled / twoFactorSecret / ultimoLoginEm…
            u.emailVerificado = Boolean.FALSE;
            u.persist();
        }
        invites.sendInviteOrReset(u, Purpose.INVITE, dto.baseUrl, 24);
        return Response.ok(Map.of("status", "sent")).build();
    }

    @POST @Path("/reset/request")
    public Response requestReset(ResetRequestDTO dto) {
        if (dto == null || dto.email == null || dto.email.isBlank() || dto.baseUrl == null)
            throw new BadRequestException("email e baseUrl são obrigatórios.");
        Usuario u = Usuario.findByEmail(dto.email);
        if (u == null) throw new NotFoundException("Usuário não encontrado.");
        invites.sendInviteOrReset(u, Purpose.RESET, dto.baseUrl, 2);
        return Response.ok(Map.of("status", "sent")).build();
    }

    @POST @Path("/password/set")
    @Transactional
    public Response setPassword(SetPasswordDTO dto) {
        if (dto == null || dto.token == null || dto.token.isBlank()
                || dto.newPassword == null || dto.newPassword.length() < 8)
            throw new BadRequestException("Token e senha (>=8) são obrigatórios.");

        Usuario u = invites.consumeTokenAndReturnUser(dto.token);
        String hash = BCrypt.hashpw(dto.newPassword, BCrypt.gensalt(12));
        u.senhaHash = hash;
        u.emailVerificado = Boolean.TRUE; // confirma e-mail ao definir senha
        return Response.ok(Map.of("ok", true, "userId", u.id)).build();
    }

    // ---------------------- LOGIN + 2FA ----------------------
    @POST @Path("/login")
    @Transactional
    public Response login(LoginDTO dto) {
        if (dto == null || dto.email == null || dto.password == null)
            throw new BadRequestException("email e password são obrigatórios.");

        Usuario u = Usuario.findByEmail(dto.email);
        if (u == null || u.senhaHash == null || !BCrypt.checkpw(dto.password, u.senhaHash)) {
            throw new NotAuthorizedException("Credenciais inválidas.");
        }
        if (Boolean.FALSE.equals(u.emailVerificado)) {
            throw new NotAuthorizedException("E-mail não verificado.");
        }

        // Se 2FA estiver habilitado, exige desafio
        if (Boolean.TRUE.equals(u.twoFactorEnabled)) {
            String session = UUID.randomUUID().toString(); // sessão efêmera; pode persistir/assinar se quiser
            return Response.ok(Map.of(
                    "requires2FA", true,
                    "session", session,
                    "email", u.email
            )).build();
        }

        // Sem 2FA: emite JWT
        u.ultimoLoginEm = OffsetDateTime.now();
        String token = jwt.issue(u.id, u.email, Set.of("user"), Duration.ofHours(8));
        return Response.ok(Map.of("token", token)).build();
    }

    @POST @Path("/2fa/challenge")
    @Transactional
    public Response verify2fa(TwoFaDTO dto) throws Exception {
        if (dto == null || dto.code == null || dto.session == null)
            throw new BadRequestException("code e session são obrigatórios.");

        // Para mapear o usuário do desafio, ler o e-mail do header enviado pelo front:
        String email = getHeader("X-User-Email");
        if (email == null || email.isBlank()) throw new BadRequestException("X-User-Email ausente.");

        Usuario u = Usuario.findByEmail(email);
        if (u == null || Boolean.FALSE.equals(u.twoFactorEnabled) || u.twoFactorSecret == null)
            throw new NotAuthorizedException("2FA não habilitado.");

        if (!totp.verifyCode(u.twoFactorSecret, dto.code)) {
            throw new NotAuthorizedException("Código 2FA inválido.");
        }
        u.ultimoLoginEm = OffsetDateTime.now();

        String token = jwt.issue(u.id, u.email, Set.of("user"), Duration.ofHours(8));
        return Response.ok(Map.of("token", token)).build();
    }

    // ----------------- SETUP / ENABLE / DISABLE 2FA -----------------
    @POST @Path("/2fa/setup")
    @RolesAllowed({"user"})
    @Transactional
    public Response setup2fa(TwoFaSetupDTO dto) throws Exception {
        Usuario u = currentUser();
        if (Boolean.TRUE.equals(u.twoFactorEnabled) && u.twoFactorSecret != null) {
            return Response.ok(Map.of("already", true)).build();
        }
        String secret = totp.newBase32Secret();
        u.twoFactorSecret = secret;
        String issuer = "Blanche";
        String otpauth = totp.otpauthUri(issuer, u.email, secret);
        return Response.ok(Map.of("secret", secret, "otpauth", otpauth)).build();
    }

    @POST @Path("/2fa/enable")
    @RolesAllowed({"user"})
    @Transactional
    public Response enable2fa(Disable2FADTO dto) throws Exception {
        Usuario u = currentUser();
        if (u.twoFactorSecret == null) throw new BadRequestException("Chame /2fa/setup antes.");
        if (dto == null || dto.code == null) throw new BadRequestException("code obrigatório.");
        if (!totp.verifyCode(u.twoFactorSecret, dto.code)) throw new NotAuthorizedException("Código inválido.");
        u.twoFactorEnabled = true;
        return Response.ok(Map.of("enabled", true)).build();
    }

    @POST @Path("/2fa/disable")
    @RolesAllowed({"user"})
    @Transactional
    public Response disable2fa(Disable2FADTO dto) throws Exception {
        Usuario u = currentUser();
        if (dto == null || dto.code == null) throw new BadRequestException("code obrigatório.");
        if (u.twoFactorSecret == null || !totp.verifyCode(u.twoFactorSecret, dto.code))
            throw new NotAuthorizedException("Código inválido.");
        u.twoFactorEnabled = false;
        u.twoFactorSecret = null;
        return Response.ok(Map.of("disabled", true)).build();
    }

    // ----------------- Helpers -----------------
    private String getHeader(String name) {
        return (httpHeaders != null) ? httpHeaders.getHeaderString(name) : null;
    }

    private Usuario currentUser() {
        if (identity == null || identity.isAnonymous())
            throw new NotAuthorizedException("Não autenticado.");

        // Por padrão, usamos o principal como userId (UUID em String)
        String subject = identity.getPrincipal().getName();
        UUID userId = UUID.fromString(subject);

        Usuario u = Usuario.findById(userId);
        if (u == null) throw new NotAuthorizedException("Usuário não encontrado.");
        return u;
    }
}
