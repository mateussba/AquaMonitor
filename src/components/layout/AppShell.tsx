import {
  Bell,
  ChartNoAxesCombined,
  Droplets,
  FileText,
  Grid2X2,
  Menu,
  MapPinned,
  Radio,
  Search,
  Settings,
  UserRound,
  ChevronRight,
} from 'lucide-react'
import { useState, type PropsWithChildren } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const navigation = [
  {
    title: 'Monitoramento',
    items: [
      { to: '/', label: 'Visão geral', icon: Grid2X2, isSection: false },
      { to: '/mapa', label: 'Mapa em tempo real', icon: MapPinned, isSection: false },
      { to: '/alertas', label: 'Alertas', icon: Bell, isSection: false, badge: '2' },
    ],
  },
  {
    title: 'Dados',
    items: [
      { to: '/ocorrencias', label: 'Ocorrências', icon: FileText, isSection: false },
      { to: '/historico', label: 'Histórico', icon: ChartNoAxesCombined, isSection: false },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { to: '/configuracoes', label: 'Configurações', icon: Settings, isSection: false },
    ],
  },
]

// PropsWithChildren adiciona a propriedade especial "children" ao tipo.
// Aqui, children será a página que o App colocou entre <AppShell> e </AppShell>.
export function AppShell({ children }: PropsWithChildren) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const mobileMenuActive = location.pathname === '/historico' || location.pathname === '/configuracoes'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/">
          <span className="brand-mark"><Droplets size={21} /></span>
          <span>Aqua<span>Monitor</span></span>
        </a>

        <nav aria-label="Navegação principal">
          {navigation.map((group) => (
            <section className="nav-group" key={group.title}>
              <div className="nav-group-heading"><span>{group.title}</span><i /></div>
              {group.items.map(({ to, label, icon: Icon, isSection, badge }) => {
                const content = <><Icon size={19} /><span>{label}</span>{badge && <b className="nav-badge">{badge}</b>}</>
                return isSection
                  ? <a key={`${label}-${to}`} href={to} className="nav-link">{content}</a>
                  : <NavLink key={`${label}-${to}`} to={to} end className="nav-link">{content}</NavLink>
              })}
            </section>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sensor-status">
            <span className="footer-icon sensor-icon"><Radio size={19} /></span>
            <div><strong>3 sensores online</strong><span><i /> Sistema conectado</span></div>
          </div>
          <div className="user-summary">
            <span className="footer-icon user-icon"><UserRound size={17} /></span>
            <div><strong>Usuário</strong><span>Visualização geral</span></div>
            <ChevronRight size={16} />
          </div>
        </div>
      </aside>

      <header className="mobile-app-header">
        <NavLink to="/" className="mobile-header-brand" aria-label="Ir para a visão geral">
          <span><Droplets /></span>
          <strong>Aqua<em>Monitor</em></strong>
        </NavLink>
        <div className="mobile-header-actions">
          <NavLink to="/ocorrencias" className="mobile-header-search" aria-label="Buscar ocorrências">
            <Search />
          </NavLink>
          <NavLink to="/alertas" className="mobile-header-alert" aria-label="Abrir alertas">
            <Bell />
            <i>2</i>
          </NavLink>
          <NavLink to="/configuracoes" className="mobile-header-profile" aria-label="Abrir perfil e configurações">
            <UserRound />
          </NavLink>
        </div>
      </header>

      {/* O conteúdo muda conforme a rota, mas a barra lateral permanece. */}
      <main className="content">{children}</main>

      {mobileMenuOpen && <button type="button" className="mobile-menu-dismiss" aria-label="Fechar menu" onClick={() => setMobileMenuOpen(false)} />}
      <nav className="mobile-navigation" aria-label="Navegação móvel">
        <NavLink to="/" end><Grid2X2 /><span>Início</span></NavLink>
        <NavLink to="/mapa"><MapPinned /><span>Mapa</span></NavLink>
        <NavLink to="/alertas"><Bell /><span>Alertas</span><i>2</i></NavLink>
        <NavLink to="/ocorrencias"><FileText /><span>Ocorrências</span></NavLink>
        <div className="mobile-more-menu">
          <button type="button" className={`mobile-menu-button ${mobileMenuActive ? 'active' : ''}`} aria-expanded={mobileMenuOpen} aria-haspopup="menu" onClick={() => setMobileMenuOpen((open) => !open)}><Menu /><span>Mais</span></button>
          {mobileMenuOpen && <div className="mobile-menu-popover" role="menu">
            <NavLink to="/historico" role="menuitem" onClick={() => setMobileMenuOpen(false)}><ChartNoAxesCombined /><span><strong>Histórico</strong><small>Eventos e níveis anteriores</small></span></NavLink>
            <NavLink to="/configuracoes" role="menuitem" onClick={() => setMobileMenuOpen(false)}><Settings /><span><strong>Configurações</strong><small>Preferências do aplicativo</small></span></NavLink>
          </div>}
        </div>
      </nav>
    </div>
  )
}
