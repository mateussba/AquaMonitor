import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { MapPage } from '@/features/map/pages/MapPage'
import { AlertsPage } from '@/features/alerts/pages/AlertsPage'
import { OccurrencesPage } from '@/features/occurrences/pages/OccurrencesPage'
import { HistoryPage } from '@/features/history/pages/HistoryPage'
import { SettingsPage } from '@/features/settings/pages/SettingsPage'

// App é o componente principal. Ele define qual página deve aparecer para cada
// endereço e coloca todas elas dentro do mesmo layout (menu + área de conteúdo).
export default function App() {
  return (
    <AppShell>
      <Routes>
        {/* Cada Route relaciona um endereço da URL a um componente de página. */}
        <Route path="/" element={<DashboardPage />} />
        <Route path="/mapa" element={<MapPage />} />
        <Route path="/alertas" element={<AlertsPage />} />
        <Route path="/ocorrencias" element={<OccurrencesPage />} />
        <Route path="/historico" element={<HistoryPage />} />
        <Route path="/configuracoes" element={<SettingsPage />} />

        {/* O asterisco captura endereços inexistentes. "replace" evita que a
            URL inválida fique guardada no histórico do botão Voltar. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}
