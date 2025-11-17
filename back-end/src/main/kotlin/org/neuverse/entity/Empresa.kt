package org.neuverse.entity

import jakarta.persistence.*
import java.time.OffsetDateTime
import java.time.ZoneOffset
import java.util.UUID

@Entity
@Table(name = "empresas", schema = "core")
class Empresa(

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    var id: UUID = UUID.randomUUID(),

    @Column(name = "nome", nullable = false)
    var nome: String = "",

    @Column(name = "criado_em", nullable = false)
    var criadoEm: OffsetDateTime = OffsetDateTime.now(ZoneOffset.UTC),

    /**
     * Empresa pode ter 1..N diretores/donos.
     * Usa uma tabela de junção core.empresa_diretores
     *  - empresa_id (UUID)
     *  - diretor_id (UUID -> usuarios.id)
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "empresa_diretores",
        schema = "core",
        joinColumns = [JoinColumn(name = "empresa_id")],
        inverseJoinColumns = [JoinColumn(name = "diretor_id")]
    )
    var diretores: MutableSet<Usuario> = mutableSetOf()
)
