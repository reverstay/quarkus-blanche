package org.neuverse.resource

import jakarta.annotation.security.RolesAllowed
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
import org.neuverse.enums.Role

@Path("/usuarios")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequestScoped
class UsuarioResource @Inject constructor(
    private val repo: UsuarioRepository,
    private val passwordService: PasswordService
) {

    /**
     * Lista usuários.
     *
     * - Se `cargo` NÃO vier: lista todos.
     * - Se `cargo` vier (1=ADMIN, 2=DIRETOR, 3=FUNCIONARIO): filtra por cargo.
     *
     * Ex.: GET /usuarios?cargo=2 -> todos diretores
     */
    @GET
    fun listAll(
        @QueryParam("cargo") cargo: Role?
    ): List<UsuarioResponseDTO> {
        val usuarios: List<Usuario> =
            if (cargo == null) {
                repo.listAll()
            } else {
                // usa Panache para filtrar pelo campo cargo (int2 no banco)
                repo.list("cargo = ?1", cargo)
            }

        return usuarios.map { UsuarioResponseDTO.fromEntity(it) }
    }

    @GET
    @Path("/{id}")
    fun getOne(@PathParam("id") id: UUID): Response {
        val usuario = repo.findByIdUuid(id)
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
            cargo = dto.cargo,            // int2 -> Int
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
