package org.neuverse.resource;

import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.mindrot.jbcrypt.BCrypt;
import org.neuverse.entity.Usuario;
import org.neuverse.service.PasswordInviteService;
import org.neuverse.entity.PasswordToken.Purpose;

import java.util.Map;
import java.util.UUID;

@Path("/auth")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject PasswordInviteService service;

    public static class InviteDTO { public String email; public String nome; public String baseUrl; }
    public static class ResetRequestDTO { public String email; public String baseUrl; }
    public static class SetPasswordDTO { public String token; public String newPassword; }

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
            u.persist();
        }
        service.sendInviteOrReset(u, Purpose.INVITE, dto.baseUrl, 24);
        return Response.ok(Map.of("status","sent")).build();
    }

    @POST @Path("/reset/request")
    public Response requestReset(ResetRequestDTO dto) {
        if (dto == null || dto.email == null || dto.email.isBlank() || dto.baseUrl == null)
            throw new BadRequestException("email e baseUrl são obrigatórios.");
        Usuario u = Usuario.findByEmail(dto.email);
        if (u == null) throw new NotFoundException("Usuário não encontrado.");
        service.sendInviteOrReset(u, Purpose.RESET, dto.baseUrl, 2);
        return Response.ok(Map.of("status","sent")).build();
    }

    @POST @Path("/password/set")
    @Transactional
    public Response setPassword(SetPasswordDTO dto) {
        if (dto == null || dto.token == null || dto.token.isBlank()
                || dto.newPassword == null || dto.newPassword.length() < 8)
            throw new BadRequestException("Token e senha (>=8) são obrigatórios.");

        Usuario u = service.consumeTokenAndReturnUser(dto.token);
        String hash = BCrypt.hashpw(dto.newPassword, BCrypt.gensalt(12));
        u.senhaHash = hash;
        return Response.ok(Map.of("ok", true, "userId", u.id)).build();
    }
}
