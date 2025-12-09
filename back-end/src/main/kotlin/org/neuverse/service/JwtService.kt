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

        // cargo é int2 no banco -> Int no entity
        val cargoNum = usuario.cargo
        val cargoStr = cargoNum.toString() // "1", "2", "3"

        return Jwt
            .issuer("neuverse-api")
            .subject(usuario.id.toString())
            .upn(usuario.email)
            // grupos usados pelo @RolesAllowed
            .groups(setOf(cargoStr))
            // claims extras que o front usa
            .claim("role", cargoNum)
            .claim("nome", usuario.nome)
            .claim("scope", cargoNum)
            .expiresAt(expiry)
            .sign(signingKey)
    }
}
