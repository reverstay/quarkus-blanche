package org.neuverse.entity

import jakarta.persistence.*
import java.time.OffsetDateTime
import java.time.ZoneOffset
import java.util.UUID

@Entity
@Table(name = "usuarios", schema = "core")
class Usuario(

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    var id: UUID = UUID.randomUUID(),

    @Column(name = "nome", nullable = false)
    var nome: String = "",

    @Column(name = "email", nullable = false, unique = true)
    var email: String = "",

    @Column(name = "online", nullable = false)
    var online: Boolean = false,

    // 👇 agora mapeado como INT (Postgres int2 → Int em Kotlin)
    @Column(name = "cargo", nullable = false)
    var cargo: Int = 3,    // 1=ADMIN, 2=DIRETOR, 3=FUNCIONARIO

    @Column(name = "criado_em", nullable = false)
    var criadoEm: OffsetDateTime = OffsetDateTime.now(ZoneOffset.UTC),

    @Column(name = "atualizado_em", nullable = false)
    var atualizadoEm: OffsetDateTime = OffsetDateTime.now(ZoneOffset.UTC),

    @Column(name = "senha_hash", nullable = false)
    var senhaHash: String = "",

    @Column(name = "loja_id")
    var lojaId: UUID? = null,

    @Column(name = "email_verificado", nullable = false)
    var emailVerificado: Boolean = false,

    @Column(name = "two_factor_enabled", nullable = false)
    var twoFactorEnabled: Boolean = false,

    @Column(name = "two_factor_secret")
    var twoFactorSecret: String? = null,

    @Column(name = "ultimo_login_em")
    var ultimoLoginEm: OffsetDateTime? = null
)
