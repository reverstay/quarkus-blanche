package org.neuverse.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Represents a store ({@code loja}) belonging to an {@link Empresa}.  The
 * {@code schema_name} column points to the dynamically provisioned schema
 * containing operational tables like movcab, movitem and funcionarios.
 */
@Entity
@Table(name = "lojas", schema = "core")
public class Loja extends PanacheEntityBase {
    @Id
    @Column(name = "id", nullable = false)
    public UUID id;

    @Column(name = "empresa_id", nullable = false)
    public UUID empresaId;

    @Column(name = "nome", nullable = false)
    public String nome;

    @Column(name = "schema_name", nullable = false)
    public String schemaName;

    @Column(name = "cidade")
    public String cidade;

    @Column(name = "status", nullable = false)
    public String status;

    @Column(name = "owner_user_id")
    public UUID ownerUserId;

    @Column(name = "criado_em", nullable = false)
    public OffsetDateTime criado_em;
}