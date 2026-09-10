import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { SettingsPage } from '@/features/settings/pages/SettingsPage'

// App é o componente principal. Ele define qual página deve aparecer para cada
// endereço e coloca todas elas dentro do mesmo layout (menu + área de conteúdo).
export default function App() {
  return (
    <AppShell>
      <Routes>
        {/* Cada Route relaciona um endereço da URL a um componente de página. */}
        <Route path="/" element={<DashboardPage />} />
        <Route path="/configuracoes" element={<SettingsPage />} />

        {/* O asterisco captura endereços inexistentes. "replace" evita que a
            URL inválida fique guardada no histórico do botão Voltar. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}
