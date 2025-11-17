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

        // Chave HMAC para HS256
        val signingKey = SecretKeySpec(
            jwtSecret.toByteArray(StandardCharsets.UTF_8),
            "HmacSHA256"
        )

        return Jwt
            .issuer("neuverse-api")                     // bate com mp.jwt.verify.issuer
            .subject(usuario.id.toString())
            .upn(usuario.email)
            .groups(setOf(usuario.cargo))               // depois pode trocar pra roles reais
            .claim("nome", usuario.nome)
            .expiresAt(expiry)
            .sign(signingKey)                           // assina com HS256 + segredo
    }
}
