import { supabase } from "../supabase";

export async function initializeDatabase() {
  console.log("🚀 Verificando schema...");

  const { data: roles } = await supabase.from("roles").select("id").limit(1);
  if (roles && roles.length > 0) {
    console.log("✅ Schema já existente");
    return;
  }

  console.log("⚙️ Criando schema via SQL...");

  const res = await fetch("/src/db/schema.sql");
  const sql = await res.text();

  const { error } = await supabase.rpc("execute_sql", { query: sql });
  if (error) console.error("Erro ao criar schema:", error);
  else console.log("✅ Schema criado com sucesso!");
}
