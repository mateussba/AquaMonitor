import {
  Bell,
  ChartNoAxesCombined,
  Droplets,
  LayoutDashboard,
  MapPinned,
  Radio,
  Settings,
} from 'lucide-react'
import type { PropsWithChildren } from 'react'
import { NavLink } from 'react-router-dom'

// A navegação fica em um array para evitar repetir o mesmo bloco de JSX.
// Quando você criar uma nova página, adicione a rota em App.tsx e um item aqui.
const navigation = [
  { to: '/', label: 'Visão geral', icon: LayoutDashboard, isSection: false },
  { to: '/#pontos', label: 'Pontos monitorados', icon: MapPinned, isSection: true },
  { to: '/#historico', label: 'Histórico', icon: ChartNoAxesCombined, isSection: true },
  { to: '/#alertas', label: 'Alertas', icon: Bell, isSection: true },
  { to: '/configuracoes', label: 'Configurações', icon: Settings, isSection: false },
]

// PropsWithChildren adiciona a propriedade especial "children" ao tipo.
// Aqui, children será a página que o App colocou entre <AppShell> e </AppShell>.
export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/">
          <span className="brand-mark"><Droplets size={24} /></span>
          <span>Aqua<span>Monitor</span></span>
        </a>

        <nav aria-label="Navegação principal">
          <p className="nav-title">Menu principal</p>
          {/* map percorre o array e devolve um link para cada item. A key ajuda
              o React a identificar cada link entre uma renderização e outra. */}
          {navigation.map(({ to, label, icon: Icon, isSection }) => {
            // Se o destino é apenas uma seção da página, um link HTML comum é
            // suficiente. NavLink fica reservado às páginas e controla o ativo.
            if (isSection) {
              return <a key={to} href={to} className="nav-link"><Icon size={19} />{label}</a>
            }

            // NavLink adiciona automaticamente a classe "active" quando sua
            // rota está aberta; o CSS usa essa classe para destacar o item.
            return <NavLink key={to} to={to} end className="nav-link"><Icon size={19} />{label}</NavLink>
          })}
        </nav>

        <div className="sidebar-footer">
          <Radio size={22} />
          <div>
            <strong>3 sensores online</strong>
            <span><i /> Sistema conectado</span>
          </div>
        </div>
      </aside>
      {/* O conteúdo muda conforme a rota, mas a barra lateral permanece. */}
      <main className="content">{children}</main>
    </div>
  )
}
