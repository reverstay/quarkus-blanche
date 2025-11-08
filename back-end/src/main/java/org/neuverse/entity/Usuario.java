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

    @Column(name = "email", nullable = false)
    public String email;

    @Column(name = "online", nullable = false)
    public Boolean online;

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

    // ---- Novos campos ----
    @Column(name = "email_verificado")
    public Boolean emailVerificado;

    @Column(name = "two_factor_enabled")
    public Boolean twoFactorEnabled;

    @Column(name = "two_factor_secret")
    public String twoFactorSecret; // base32

    @Column(name = "ultimo_login_em")
    public OffsetDateTime ultimoLoginEm;

    public static Usuario findByEmail(String email) {
        return find("email", email).firstResult();
    }

    @PrePersist
    void prePersist() {
        if (id == null) id = UUID.randomUUID();
        if (online == null) online = Boolean.FALSE;
        if (emailVerificado == null) emailVerificado = Boolean.FALSE;
        if (twoFactorEnabled == null) twoFactorEnabled = Boolean.FALSE;
        if (criadoEm == null) criadoEm = OffsetDateTime.now();
        atualizadoEm = criadoEm;
    }

    @PreUpdate
    void preUpdate() { atualizadoEm = OffsetDateTime.now(); }
}
