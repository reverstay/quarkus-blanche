package org.neuverse.repository

import io.quarkus.hibernate.orm.panache.kotlin.PanacheRepositoryBase
import jakarta.enterprise.context.ApplicationScoped
import org.neuverse.entity.Usuario
import java.util.UUID

@ApplicationScoped
class UsuarioRepository : PanacheRepositoryBase<Usuario, UUID> {

    fun findByEmail(email: String): Usuario? =
        find("email", email).firstResult()

    fun existsByEmail(email: String): Boolean =
        find("email", email).firstResult() != null
}
