package org.neuverse.service

import jakarta.enterprise.context.ApplicationScoped
import jakarta.inject.Inject
import org.eclipse.microprofile.config.inject.ConfigProperty
import org.mindrot.jbcrypt.BCrypt

@ApplicationScoped
class PasswordService @Inject constructor(
    @ConfigProperty(name = "auth.pepper")
    private val pepper: String
) {

    fun hash(rawPassword: String): String =
        BCrypt.hashpw(rawPassword + pepper, BCrypt.gensalt(12))

    fun verify(rawPassword: String, hashedPassword: String): Boolean =
        BCrypt.checkpw(rawPassword + pepper, hashedPassword)
}
