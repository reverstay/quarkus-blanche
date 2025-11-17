package org.neuverse.service

import jakarta.enterprise.context.ApplicationScoped
import org.mindrot.jbcrypt.BCrypt

@ApplicationScoped
class PasswordService {

    fun hash(rawPassword: String): String =
        BCrypt.hashpw(rawPassword, BCrypt.gensalt(12))

    fun verify(rawPassword: String, hashedPassword: String): Boolean =
        BCrypt.checkpw(rawPassword, hashedPassword)
}
