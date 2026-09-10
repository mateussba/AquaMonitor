import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// No Vite, somente variáveis que começam com VITE_ podem ser lidas pelo código
// executado no navegador. Por isso elas precisam conter apenas dados públicos.
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/**
 * Cliente único do Supabase. A chamada é adiada para evitar quebrar a interface
 * enquanto o projeto ainda não tiver as variáveis de ambiente configuradas.
 */
export function getSupabaseClient() {
  // Falhar com uma mensagem clara aqui é melhor do que receber um erro pouco
  // explicativo do Supabase quando alguém esquecer de criar o .env.local.
  if (!url || !key) {
    throw new Error(
      'Supabase não configurado. Copie .env.example para .env.local e informe as credenciais.',
    )
  }
  return createClient<Database>(url, key)
}
