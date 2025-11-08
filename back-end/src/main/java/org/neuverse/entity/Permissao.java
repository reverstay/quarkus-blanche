package org.neuverse.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Represents a permission ({@code core.permissoes}).  A permission associates
 * a user to a role within a company and optionally a specific store.
 */
@Entity
@Table(name = "permissoes", schema = "core")
public class Permissao extends PanacheEntityBase {
    @Id
    @Column(name = "id", nullable = false)
    public UUID id;

    @Column(name = "user_id", nullable = false)
    public UUID userId;

    @Column(name = "empresa_id", nullable = false)
    public UUID empresaId;

    @Column(name = "loja_id")
    public UUID lojaId;

    @Column(name = "role", nullable = false)
    public String role;

    @Column(name = "ativo", nullable = false)
    public boolean ativo;

    @Column(name = "criado_por")
    public UUID criadoPor;

    @Column(name = "criado_em", nullable = false)
    public OffsetDateTime criado_em;

    @Column(name = "atualizado_em", nullable = false)
    public OffsetDateTime atualizado_em;
}