package org.neuverse.dto

import org.neuverse.entity.Empresa
import org.neuverse.entity.Unidade
import java.time.OffsetDateTime
import java.util.UUID

// ====== EMPRESA ======

data class EmpresaCreateDTO(
    val nome: String,
    val diretoresIds: List<UUID> = emptyList()
)

data class EmpresaResponseDTO(
    val id: UUID,
    val nome: String,
    val criadoEm: OffsetDateTime,
    val diretoresIds: List<UUID>
) {
    companion object {
        fun fromEntity(e: Empresa) = EmpresaResponseDTO(
            id = e.id,
            nome = e.nome,
            criadoEm = e.criadoEm,
            diretoresIds = e.diretores.map { it.id }
        )
    }
}

// ====== UNIDADE ======

data class UnidadeCreateDTO(
    val nome: String,
    val empresaId: UUID,
    val endereco: String
)

data class UnidadeResponseDTO(
    val id: UUID,
    val nome: String,
    val empresaId: UUID,
    val endereco: String,
    val criadoEm: OffsetDateTime
) {
    companion object {
        fun fromEntity(u: Unidade) = UnidadeResponseDTO(
            id = u.id,
            nome = u.nome,
            empresaId = u.empresa.id,
            endereco = u.endereco,
            criadoEm = u.criadoEm
        )
    }
}
