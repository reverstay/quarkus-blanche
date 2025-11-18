package org.neuverse.enums

enum class Role(val code: Short) {
    ADMIN(1),
    DIRETOR(2),
    FUNCIONARIO(3);

    companion object {
        fun getId(code: Short?): Role =
            values().find { it.code == code } ?: FUNCIONARIO
    }
}
