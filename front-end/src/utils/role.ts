export type RoleName = "ADMIN" | "DIRETOR" | "FUNCIONARIO";

export function mapCargoToRoleName(cargo?: number | string | null): RoleName {
  const n = typeof cargo === "string" ? parseInt(cargo, 10) : cargo ?? 3;
  switch (n) {
    case 1:
      return "ADMIN";
    case 2:
      return "DIRETOR";
    default:
      return "FUNCIONARIO";
  }
}
