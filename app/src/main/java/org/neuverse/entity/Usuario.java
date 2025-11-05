package org.neuverse.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "usuarios", schema = "core")
public class Usuario extends PanacheEntityBase {

    @Id
    @Column(name = "id", nullable = false)
    public UUID id;

    @Column(name = "nome")
    public String nome;

    @Column(name = "email", nullable = false/*, unique = true*/)
    public String email;

    @Column(name = "online", nullable = false)
    public Boolean online; // wrapper p/ permitir null no payload

    @Column(name = "cargo")
    public String cargo;

    @Column(name = "senha_hash")
    public String senhaHash;

    @Column(name = "loja_id")
    public UUID lojaId;

    @Column(name = "criado_em")
    public OffsetDateTime criadoEm;

    @Column(name = "atualizado_em")
    public OffsetDateTime atualizadoEm;

    public static Usuario findByEmail(String email) {
        return find("email", email).firstResult();
    }

    @PrePersist
    void prePersist() {
        if (id == null) id = UUID.randomUUID();
        if (online == null) online = Boolean.FALSE;
        if (criadoEm == null) criadoEm = OffsetDateTime.now();
        atualizadoEm = criadoEm;
    }

    @PreUpdate
    void preUpdate() { atualizadoEm = OffsetDateTime.now(); }
}
