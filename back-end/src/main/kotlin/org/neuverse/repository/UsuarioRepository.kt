package org.neuverse.repository

import io.quarkus.hibernate.orm.panache.kotlin.PanacheRepository
import jakarta.enterprise.context.ApplicationScoped
import org.neuverse.entity.Usuario
import java.util.UUID

@ApplicationScoped
class UsuarioRepository : PanacheRepository<Usuario> {

    fun findByEmail(email: String): Usuario? =
        find("email", email).firstResult()

    fun existsByEmail(email: String): Boolean =
        count("email", email) > 0

    /**
     * Helper para buscar por UUID sem depender da assinatura de findById do Panache.
     */
    fun findByIdUuid(id: UUID): Usuario? =
        find("id", id).firstResult()
}
