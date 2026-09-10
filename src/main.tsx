import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/globals.css'
// Este segundo arquivo contém o visual novo do painel. Separar ele facilita
// comparar a base original com a evolução feita a partir dela.
import './styles/dashboard.css'

// O HTML possui uma <div id="root"> vazia. O React assume o controle dessa
// div e passa a montar toda a interface dentro dela.
// O sinal "!" avisa ao TypeScript que sabemos que esse elemento existe.
createRoot(document.getElementById('root')!).render(
  // StrictMode ajuda a encontrar efeitos colaterais e práticas inseguras
  // durante o desenvolvimento. Ele não acrescenta nenhum elemento à tela.
  <StrictMode>
    {/* BrowserRouter observa a URL e permite trocar de página sem recarregar o site. */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
