package org.neuverse.resource

import jakarta.enterprise.context.RequestScoped
import jakarta.inject.Inject
import jakarta.transaction.Transactional
import jakarta.ws.rs.*
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import org.neuverse.dto.LoginRequestDTO
import org.neuverse.dto.LoginResponseDTO
import org.neuverse.dto.UsuarioCreateDTO
import org.neuverse.dto.UsuarioResponseDTO
import org.neuverse.entity.Usuario
import org.neuverse.repository.UsuarioRepository
import org.neuverse.service.JwtService
import org.neuverse.service.PasswordService
import java.time.OffsetDateTime
import java.time.ZoneOffset
import java.util.UUID

@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequestScoped
class AuthResource @Inject constructor(
    private val usuarioRepository: UsuarioRepository,
    private val passwordService: PasswordService,
    private val jwtService: JwtService
) {

    /**
     * Endpoint para criar o primeiro admin (ou admins em geral).
     * Você pode travar isso por config depois.
     */
    @POST
    @Path("/register-admin")
    @Transactional
    fun registerAdmin(dto: UsuarioCreateDTO): Response {
        if (usuarioRepository.existsByEmail(dto.email)) {
            return Response.status(Response.Status.CONFLICT)
                .entity(mapOf("error" to "E-mail já cadastrado"))
                .build()
        }

        val now = OffsetDateTime.now(ZoneOffset.UTC)
        val hash = passwordService.hash(dto.senha)

        val usuario = Usuario(
            id = UUID.randomUUID(),
            nome = dto.nome,
            email = dto.email,
            cargo = dto.cargo.ifBlank { "ADMIN" },
            online = false,
            senhaHash = hash,
            criadoEm = now,
            atualizadoEm = now,
            lojaId = null,
            emailVerificado = false,
            twoFactorEnabled = false,
            twoFactorSecret = null,
            ultimoLoginEm = null
        )

        usuarioRepository.persist(usuario)

        val token = jwtService.generateToken(usuario)

        return Response.status(Response.Status.CREATED)
            .entity(
                LoginResponseDTO(
                    token = token,
                    usuario = UsuarioResponseDTO.fromEntity(usuario)
                )
            )
            .build()
    }

    @POST
    @Path("/login")
    @Transactional
    fun login(dto: LoginRequestDTO): Response {
        val usuario = usuarioRepository.findByEmail(dto.email)
            ?: return Response.status(Response.Status.UNAUTHORIZED)
                .entity(mapOf("error" to "Credenciais inválidas"))
                .build()

        if (!passwordService.verify(dto.senha, usuario.senhaHash)) {
            return Response.status(Response.Status.UNAUTHORIZED)
                .entity(mapOf("error" to "Credenciais inválidas"))
                .build()
        }

        usuario.ultimoLoginEm = OffsetDateTime.now(ZoneOffset.UTC)
        usuario.atualizadoEm = usuario.ultimoLoginEm ?: usuario.atualizadoEm
        usuarioRepository.persist(usuario)

        val token = jwtService.generateToken(usuario)

        return Response.ok(
            LoginResponseDTO(
                token = token,
                usuario = UsuarioResponseDTO.fromEntity(usuario)
            )
        ).build()
    }
}
