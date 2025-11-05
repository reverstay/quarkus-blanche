package org.neuverse.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Entity mapping to {@code core.usuarios}.  Note the use of {@link LocalDate}
 * for the {@code data_admissao} column.
 */
@Entity
@Table(name = "usuarios", schema = "core")
public class Usuario extends PanacheEntityBase {
    @Id
    @Column(name = "id", nullable = false)
    public UUID id;

    @Column(name = "nome")
    public String nome;

    @Column(name = "email", nullable = false)
    public String email;

    @Column(name = "online", nullable = false)
    public boolean online;

    @Column(name = "cargo")
    public String cargo;

    @Column(name = "cpf")
    public String cpf;

    @Column(name = "data_admissao")
    public LocalDate dataAdmissao;

    @Column(name = "criado_em", nullable = false)
    public OffsetDateTime criado_em;
}