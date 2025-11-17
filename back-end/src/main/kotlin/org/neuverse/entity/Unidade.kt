package org.neuverse.entity

import jakarta.persistence.*
import java.time.OffsetDateTime
import java.time.ZoneOffset
import java.util.UUID

@Entity
@Table(name = "unidades", schema = "core")
class Unidade(

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    var id: UUID = UUID.randomUUID(),

    @Column(name = "nome", nullable = false)
    var nome: String = "",

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    var empresa: Empresa,

    @Column(name = "endereco", nullable = false)
    var endereco: String = "",

    @Column(name = "criado_em", nullable = false)
    var criadoEm: OffsetDateTime = OffsetDateTime.now(ZoneOffset.UTC)
)
