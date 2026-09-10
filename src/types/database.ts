/**
 * Tipos do banco. Após definir as tabelas, substitua este arquivo pelos tipos
 * gerados com: supabase gen types typescript --linked > src/types/database.ts
 */
export type Database = {
  // "public" é o schema padrão do PostgreSQL usado pelo Supabase. Um schema
  // funciona como uma pasta lógica que organiza tabelas e outros objetos.
  public: {
    // Record<string, never> indica que ainda não há objetos conhecidos. Quando
    // os tipos forem gerados pela CLI, estes campos ganharão a estrutura real.
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
