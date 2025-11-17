package org.neuverse.repository

import io.quarkus.hibernate.orm.panache.kotlin.PanacheRepository
import jakarta.enterprise.context.ApplicationScoped
import org.neuverse.entity.Unidade
import java.util.UUID

@ApplicationScoped
class UnidadeRepository : PanacheRepository<Unidade> {

    fun listByEmpresaId(empresaId: UUID): List<Unidade> =
        list("empresa.id", empresaId)
}
