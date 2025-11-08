package org.neuverse.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "password_tokens", schema = "core")
public class PasswordToken extends PanacheEntityBase {

    public enum Purpose { INVITE, RESET }

    @Id
    @Column(name = "id", nullable = false)
    public UUID id;

    @Column(name = "user_id", nullable = false)
    public UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "purpose", nullable = false)
    public Purpose purpose;

    @Column(name = "token_hash", nullable = false)
    public byte[] tokenHash; // SHA-256 do token

    @Column(name = "created_at", nullable = false)
    public OffsetDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    public OffsetDateTime expiresAt;

    @Column(name = "used_at")
    public OffsetDateTime usedAt;

    @PrePersist
    void prePersist() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }
}
