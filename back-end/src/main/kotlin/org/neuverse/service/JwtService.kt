package org.neuverse.service

import jakarta.enterprise.context.ApplicationScoped
import org.eclipse.microprofile.config.inject.ConfigProperty
import org.neuverse.entity.Usuario
import io.smallrye.jwt.build.Jwt
import java.nio.charset.StandardCharsets
import java.time.Instant
import java.time.temporal.ChronoUnit
import javax.crypto.spec.SecretKeySpec

@ApplicationScoped
class JwtService(

    @ConfigProperty(name = "jwt.secret")
    private val jwtSecret: String
) {

    fun generateToken(usuario: Usuario): String {
        val expiry = Instant.now().plus(1, ChronoUnit.HOURS)

        val signingKey = SecretKeySpec(
            jwtSecret.toByteArray(StandardCharsets.UTF_8),
            "HmacSHA256"
        )

        val role = when (usuario.cargo) {
            1 -> "ADMIN"
            2 -> "DIRETOR"
            else -> "FUNCIONARIO"
        }

        return Jwt
            .issuer("neuverse-api")
            .subject(usuario.id.toString())
            .upn(usuario.email)
            .groups(setOf(role))                // usado pelo @RolesAllowed
            .claim("nome", usuario.nome)
            .claim("role", role)                // para ler em currentRole()
            .expiresAt(expiry)
            .sign(signingKey)
    }
}
