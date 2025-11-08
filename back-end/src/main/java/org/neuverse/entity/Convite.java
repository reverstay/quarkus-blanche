package org.neuverse.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Represents an invitation ({@code core.convites}).  Invitations are used to
 * onboard users by email and assign a role within an enterprise or store.
 */
@Entity
@Table(name = "convites", schema = "core")
public class Convite extends PanacheEntityBase {
    @Id
    @Column(name = "id", nullable = false)
    public UUID id;

    @Column(name = "issuer_user_id", nullable = false)
    public UUID issuerUserId;

    @Column(name = "target_email", nullable = false)
    public String targetEmail;

    @Column(name = "role", nullable = false)
    public String role;

    @Column(name = "empresa_id", nullable = false)
    public UUID empresaId;

    @Column(name = "loja_id")
    public UUID lojaId;

    @Column(name = "token", nullable = false)
    public String token;

    @Column(name = "expires_at", nullable = false)
    public OffsetDateTime expires_at;

    @Column(name = "status", nullable = false)
    public String status;

    @Column(name = "criado_em", nullable = false)
    public OffsetDateTime criado_em;
}