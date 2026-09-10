// Por enquanto esta é uma página informativa. Deixar o componente separado
// deixa o projeto pronto para receber formulários de configuração no futuro.
export function SettingsPage() {
  return (
    <section className="page narrow-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Configurações</p>
          <h1>Integração com Supabase</h1>
          <p className="subtitle">Configure as credenciais locais para conectar o dashboard ao banco de dados.</p>
        </div>
      </header>
      {/* <code> é uma tag semântica usada para nomes de arquivos e trechos de código. */}
      <article className="panel settings-card">
        <h2>Próximo passo</h2>
        <p>Copie o arquivo <code>.env.example</code> como <code>.env.local</code> e informe a URL e a chave publicável do projeto Supabase. O arquivo local não será enviado para o Git.</p>
      </article>
    </section>
  )
}
