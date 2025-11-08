package org.neuverse.service;

import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Duration;
import java.util.Set;
import java.util.UUID;

@ApplicationScoped
public class JwtService {

    public String issue(UUID userId, String email, Set<String> roles, Duration ttl) {
        return Jwt.issuer("blanche-auth")
                .upn(email)
                .subject(userId.toString())
                .groups(roles == null ? Set.of("user") : roles)
                .expiresIn(ttl)
                .sign();
    }
}
