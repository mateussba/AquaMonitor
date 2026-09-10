import type { ReactNode } from 'react'

type MetricCardProps = {
  // Estas propriedades formam o "contrato" do componente: quem usar
  // MetricCard precisa fornecer label, value e icon nos tipos indicados.
  label: string
  value: string
  detail?: string
  icon: ReactNode
  // O caractere ? torna a propriedade opcional. A união abaixo impede cores
  // que o CSS do componente não conhece.
  tone?: 'blue' | 'green' | 'amber' | 'red'
}

// Este componente recebe informações por props. Assim, o dashboard decide os
// dados e o cartão cuida somente da apresentação visual.
export function MetricCard({ label, value, detail, icon, tone = 'blue' }: MetricCardProps) {
  return (
    <article className="metric-card">
      {/* As crases criam uma template string, juntando as duas classes CSS. */}
      <div className={`metric-icon ${tone}`}>{icon}</div>
      <div>
        <strong>{value}</strong>
        <p>{label}</p>
        {/* O && faz uma renderização condicional: o <small> só existe quando
            a propriedade detail contém algum texto. */}
        {detail && <small>{detail}</small>}
      </div>
    </article>
  )
}
