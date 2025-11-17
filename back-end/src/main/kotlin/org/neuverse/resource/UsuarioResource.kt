package org.neuverse.resource

import jakarta.enterprise.context.RequestScoped
import jakarta.inject.Inject
import jakarta.transaction.Transactional
import jakarta.ws.rs.*
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import org.neuverse.dto.UsuarioCreateDTO
import org.neuverse.dto.UsuarioResponseDTO
import org.neuverse.entity.Usuario
import org.neuverse.repository.UsuarioRepository
import org.neuverse.service.PasswordService
import java.time.OffsetDateTime
import java.time.ZoneOffset
import java.util.UUID

@Path("/usuarios")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequestScoped
class UsuarioResource @Inject constructor(
    private val repo: UsuarioRepository,
    private val passwordService: PasswordService
) {

    @GET
    fun listAll(): List<UsuarioResponseDTO> =
        repo.listAll().map { UsuarioResponseDTO.fromEntity(it) }

    @GET
    @Path("/{id}")
    fun getOne(@PathParam("id") id: UUID): Response {
        val usuario = repo.findById(id)
            ?: return Response.status(Response.Status.NOT_FOUND).build()

        return Response.ok(UsuarioResponseDTO.fromEntity(usuario)).build()
    }

    @POST
    @Transactional
    fun create(dto: UsuarioCreateDTO): Response {
        if (repo.existsByEmail(dto.email)) {
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
            cargo = dto.cargo,
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

        repo.persist(usuario)

        return Response.status(Response.Status.CREATED)
            .entity(UsuarioResponseDTO.fromEntity(usuario))
            .build()
    }
}
