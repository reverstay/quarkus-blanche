package org.neuverse.service

import jakarta.enterprise.context.ApplicationScoped
import org.neuverse.entity.Usuario
import io.smallrye.jwt.build.Jwt
import java.time.Instant
import java.time.temporal.ChronoUnit

@ApplicationScoped
class JwtService {

    fun generateToken(usuario: Usuario): String {
        val expiry = Instant.now().plus(1, ChronoUnit.HOURS)

        return Jwt.issuer("neuverse-api")
            .subject(usuario.id.toString())
            .upn(usuario.email)
            .groups(setOf(usuario.cargo)) // grupos = cargos
            .claim("nome", usuario.nome)
            .expiresAt(expiry)
            .sign()
    }
}
