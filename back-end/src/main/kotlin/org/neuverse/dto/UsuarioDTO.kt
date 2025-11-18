package org.neuverse.dto

import org.neuverse.entity.Usuario
import java.time.OffsetDateTime
import java.util.UUID
import org.neuverse.enums.Role

data class UsuarioCreateDTO(
    val nome: String = "",
    val email: String = "",
    val cargo: Role = Role.FUNCIONARIO,  // 1=ADMIN, 2=DIRETOR, 3=FUNCIONARIO
    val senha: String = ""
)

data class UsuarioResponseDTO(
    val id: UUID,
    val nome: String,
    val email: String,
    val cargo: Role,
    val online: Boolean,
    val emailVerificado: Boolean,
    val twoFactorEnabled: Boolean,
    val criadoEm: OffsetDateTime,
    val atualizadoEm: OffsetDateTime
) {
    companion object {
        fun fromEntity(u: Usuario) = UsuarioResponseDTO(
            id = u.id,
            nome = u.nome,
            email = u.email,
            cargo = u.cargo,
            online = u.online,
            emailVerificado = u.emailVerificado,
            twoFactorEnabled = u.twoFactorEnabled,
            criadoEm = u.criadoEm,
            atualizadoEm = u.atualizadoEm
        )
    }
}

data class LoginRequestDTO(
    val email: String,
    val senha: String
)

data class LoginResponseDTO(
    val token: String,
    val usuario: UsuarioResponseDTO
)
