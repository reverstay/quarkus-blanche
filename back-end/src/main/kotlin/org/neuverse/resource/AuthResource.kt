package org.neuverse.resource

import jakarta.enterprise.context.RequestScoped
import jakarta.inject.Inject
import jakarta.transaction.Transactional
import jakarta.ws.rs.*
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import org.neuverse.dto.LoginRequestDTO
import org.neuverse.dto.LoginResponseDTO
import org.neuverse.dto.UsuarioResponseDTO
import org.neuverse.repository.UsuarioRepository
import org.neuverse.service.JwtService
import org.neuverse.service.PasswordService

@Path("/auth")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RequestScoped
class AuthResource @Inject constructor(
    private val usuarioRepository: UsuarioRepository,
    private val passwordService: PasswordService,
    private val jwtService: JwtService
) {

    @POST
    @Path("/login")
    @Transactional
    fun login(dto: LoginRequestDTO): Response {
        // 1) Busca usuário pelo e-mail
        val usuario = usuarioRepository.findByEmail(dto.email)
            ?: return Response.status(Response.Status.UNAUTHORIZED)
                .entity(mapOf("error" to "Credenciais inválidas"))
                .build()

        // 2) Confere senha com pepper (PasswordService já trata o pepper)
        val ok = passwordService.verify(dto.senha, usuario.senhaHash)
        if (!ok) {
            return Response.status(Response.Status.UNAUTHORIZED)
                .entity(mapOf("error" to "Credenciais inválidas"))
                .build()
        }

        // 3) Gera token JWT
        val token = jwtService.generateToken(usuario)

        // 4) Monta resposta com token + usuário
        val body = LoginResponseDTO(
            token = token,
            usuario = UsuarioResponseDTO.fromEntity(usuario)
        )

        return Response.ok(body).build()
    }
}
