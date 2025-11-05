package org.neuverse.entity;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Entity representing a row in the {@code core.empresas} table.  Using Panache
 * simplifies CRUD operations, letting us write endpoints that call
 * {@link Empresa#listAll()} or {@link Empresa#findById(Object)} directly.
 */
@Entity
@Table(name = "empresas", schema = "core")
public class Empresa extends PanacheEntityBase {
    @Id
    @Column(name = "id", nullable = false)
    public UUID id;

    @Column(name = "nome", nullable = false)
    public String nome;

    @Column(name = "slug", nullable = false)
    public String slug;

    @Column(name = "cnpj")
    public String cnpj;

    @Column(name = "status", nullable = false)
    public String status;

    @Column(name = "criado_em", nullable = false)
    public OffsetDateTime criado_em;

    @Column(name = "atualizado_em", nullable = false)
    public OffsetDateTime atualizado_em;
}