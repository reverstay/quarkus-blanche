package org.neuverse.resource

import jakarta.annotation.security.RolesAllowed
import jakarta.enterprise.context.RequestScoped
import jakarta.inject.Inject
import jakarta.transaction.Transactional
import jakarta.ws.rs.*
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import org.eclipse.microprofile.jwt.JsonWebToken
import org.neuverse.dto.*
import org.neuverse.entity.Empresa
import org.neuverse.entity.Unidade
import org.neuverse.repository.EmpresaRepository
import org.neuverse.repository.UnidadeRepository
import org.neuverse.repository.UsuarioRepository
import java.util.UUID

@Path("/empresas")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RequestScoped
class EmpresaResource @Inject constructor(
    private val empresaRepo: EmpresaRepository,
    private val unidadeRepo: UnidadeRepository,
    private val usuarioRepo: UsuarioRepository,
    private val jwt: JsonWebToken
) {

    // ====== Helpers internos ======

    private fun currentUserId(): UUID =
        UUID.fromString(jwt.subject)

    private fun currentRole(): String =
        (jwt.getClaim<String>("role") ?: "FUNCIONARIO").uppercase()

    private fun isAdmin(): Boolean = currentRole() == "ADMIN"
    private fun isDiretor(): Boolean = currentRole() == "DIRETOR"


    // ====== EMPRESAS ======

    /**
     * Admin: vê todas as empresas
     * Diretor: vê apenas empresas em que é diretor
     */
    @GET
    @Path("/minhas")
    @RolesAllowed("ADMIN", "DIRETOR")
    fun minhasEmpresas(): List<EmpresaResponseDTO> {
        val userId = currentUserId()

        return if (isAdmin()) {
            empresaRepo.listAll().map { EmpresaResponseDTO.fromEntity(it) }
        } else {
            val empresas = empresaRepo.listByDiretorId(userId)
            empresas.map { EmpresaResponseDTO.fromEntity(it) }
        }
    }

    /**
     * Criar empresa
     *  - Apenas ADMIN
     *  - Pode já vincular diretores (lista de UUIDs)
     */
    @POST
    @Transactional
    @RolesAllowed("ADMIN")
    fun createEmpresa(dto: EmpresaCreateDTO): Response {
        val empresa = Empresa(
            nome = dto.nome.trim()
        )

        if (dto.diretoresIds.isNotEmpty()) {
            val diretores = dto.diretoresIds
                .mapNotNull { usuarioRepo.findByIdUuid(it) }
                .filter { it.cargo == 2 } // 2 = DIRETOR (int2)

            empresa.diretores.addAll(diretores)
        }

        empresaRepo.persist(empresa)

        return Response.status(Response.Status.CREATED)
            .entity(EmpresaResponseDTO.fromEntity(empresa))
            .build()
    }

    // ====== UNIDADES ======

    /**
     * Lista unidades de uma empresa
     *  - ADMIN: pode tudo
     *  - DIRETOR: só se for diretor dessa empresa
     */
    @GET
    @Path("/{id}/unidades")
    @RolesAllowed("ADMIN", "DIRETOR")
    fun unidadesDaEmpresa(@PathParam("id") empresaId: UUID): List<UnidadeResponseDTO> {
        val empresa = empresaRepo.findByIdUuid(empresaId)
            ?: throw NotFoundException("Empresa não encontrada")

        if (isDiretor() && !isDiretorDaEmpresa(empresa.id)) {
            throw ForbiddenException("Você não é diretor desta empresa")
        }

        return unidadeRepo.listByEmpresaId(empresa.id)
            .map { UnidadeResponseDTO.fromEntity(it) }
    }
    /**
     * Criar unidade dentro de uma empresa
     *  - ADMIN: qualquer empresa
     *  - DIRETOR: apenas empresas onde ele é diretor
     */
    @POST
    @Path("/{id}/unidades")
    @Transactional
    @RolesAllowed("ADMIN", "DIRETOR")
    fun createUnidade(
        @PathParam("id") empresaId: UUID,
        dto: UnidadeCreateDTO
    ): Response {
        val empresa = empresaRepo.findByIdUuid(empresaId)
            ?: throw NotFoundException("Empresa não encontrada")

        if (isDiretor() && !isDiretorDaEmpresa(empresa.id)) {
            throw ForbiddenException("Você não é diretor desta empresa")
        }

        val unidade = Unidade(
            nome = dto.nome.trim(),
            empresa = empresa,
            endereco = dto.endereco.trim()
        )

        unidadeRepo.persist(unidade)

        return Response.status(Response.Status.CREATED)
            .entity(UnidadeResponseDTO.fromEntity(unidade))
            .build()
    }

    // ====== Função auxiliar ======

    private fun isDiretorDaEmpresa(empresaId: UUID): Boolean {
        val userId = currentUserId()
        val empresas = empresaRepo.listByDiretorId(userId)
        return empresas.any { it.id == empresaId }
    }
}
