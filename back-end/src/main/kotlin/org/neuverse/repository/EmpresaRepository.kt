package org.neuverse.repository

import io.quarkus.hibernate.orm.panache.kotlin.PanacheRepository
import jakarta.enterprise.context.ApplicationScoped
import org.neuverse.entity.Empresa
import java.util.UUID

@ApplicationScoped
class EmpresaRepository : PanacheRepository<Empresa> {

    fun listByDiretorId(diretorId: UUID): List<Empresa> =
        list("diretores.id", diretorId)

    fun findByIdUuid(id: UUID): Empresa? =
        find("id", id).firstResult()
}
