import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from './lib/workflow-api';
import { money, statusLabel } from './lib/workflow-api';
import { factoryLoginUrl } from './lib/runtime';
import './operations.css';

type FactoryStock = { id: number; stockId: number; name: string; sku: string; kind: string; lot: string; quantity: number; unit: string; location: string };
type Run = { id: number; code: string; state: string; quantity: number; product: string; recipeName: string; mold: string; autoclave: number | null; updatedAt: string };
type Overview = {
  generatedAt: string; metrics: Record<string, number | null>;
  stock: { onHand: number; reserved: number; available: number; variants: { sku: string; onHand: number; reserved: number; available: number; widthMm: number; heightMm: number; thicknessMm: number }[] };
  recentQuotations: { reference: string; customerName: string; company: string; reviewStatus: string; itemsCount: number }[];
  recentOrders: { reference: string; customerName?: string; status: string; productionReady: boolean }[];
  activity: { at: string; actor: string; action: string; reference: string }[];
  factory: { available: boolean; stocks?: FactoryStock[]; runs?: Run[]; events?: { id: number; at: string; actor: string; action: string; change: Record<string, string | number> }[] };
};
const roleNames: Record<string, string> = { admin: 'Proprietário / administrador', sales: 'Equipe comercial', warehouse: 'Produção e expedição', viewer: 'Consulta' };
const stages: Record<string, string> = { planned: 'Planejado', running: 'Moldagem / produção', autoclave: 'Na autoclave', quality: 'Qualidade', released: 'Liberado', rejected: 'Reprovado' };
const actions: Record<string, string> = { 'inventory.adjusted': 'Estoque comercial ajustado', 'offer.created': 'Proposta publicada', 'offer.accepted': 'Proposta aceita e estoque reservado', 'payment.recorded': 'Pagamento de teste confirmado', 'order.fulfilled': 'Expedição registrada e saldo baixado', 'quotation.reviewing': 'Consulta em análise', 'demo.production_ready': 'Produção sob encomenda conferida', 'stock.adjusted': 'Estoque da fábrica ajustado', 'production.planned': 'Ordem de demonstração criada', 'production.running': 'Produção iniciada e materiais consumidos', 'production.autoclave': 'Entrada registrada na autoclave', 'production.quality': 'Lote encaminhado à qualidade', 'production.released': 'Chapas registradas no estoque', 'production.rejected': 'Lote reprovado' };
const login = factoryLoginUrl(import.meta.env.VITE_FACTORY_URL);
const factoryOrigin = login ? new URL(login).origin : null;

export default function OperationsOverview({ session, onNavigate }: { session: Session; onNavigate: (tab: string) => void }) {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [stockView, setStockView] = useState<'factory' | 'sales'>('factory');
  const [allStock, setAllStock] = useState(false);
  const alive = useRef(true);
  const pending = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    if (pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setLoading(true);
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch('/api/staff/overview', { credentials: 'same-origin', signal: controller.signal });
      if (!response.ok) throw new Error(response.status === 401 ? 'Sua sessão terminou. Entre novamente para atualizar.' : 'Não foi possível confirmar uma atualização.');
      const result = await response.json() as Overview;
      if (alive.current) { setData(result); setError(''); }
    } catch (reason) {
      if (alive.current) setError(reason instanceof Error && reason.name !== 'AbortError' ? reason.message : 'A consulta demorou mais que o esperado.');
    } finally {
      window.clearTimeout(timeout);
      pending.current = null;
      if (alive.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    alive.current = true;
    void refresh();
    const timer = window.setInterval(() => { if (!document.hidden) void refresh(); }, 7000);
    return () => { alive.current = false; window.clearInterval(timer); pending.current?.abort(); };
  }, [refresh]);
  const financial = ['admin', 'sales'].includes(session.user.role);
  const runs = data?.factory.runs || [];
  const factoryStock = data?.factory.stocks || [];
  const variants = (data?.stock.variants || []).filter(v => allStock || v.sku.startsWith('DEMO-OWNER-'));
  const activity = [...(data?.activity || []).map(a => ({ ...a, source: 'Comercial', change: '' })), ...(data?.factory.events || []).map(a => ({ ...a, source: 'Fábrica', reference: '', change: a.change.autoclave && !a.change.materials ? `Autoclave ${a.change.autoclave} · ${a.change.mold || ''}` : a.change.materials ? `${a.change.materials} materiais baixados pela receita simulada` : a.change.before !== undefined ? `Saldo ${a.change.before} → ${a.change.after}` : a.change.consumed ? `${a.change.consumed} kits consumidos` : a.change.outputStockId ? `Saída #${a.change.outputStockId}` : '' }))].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 14);

  return <div className="operations-overview">
    <div className="ops-heading"><div><div className="ops-eyebrow">CONTROLE DA OPERAÇÃO</div><h1>Visão geral</h1><p>{roleNames[session.user.role]} · <strong>{session.user.username}</strong></p></div><div className="ops-refresh"><span className={error ? 'ops-live stale' : 'ops-live'} role="status">{data ? `${error ? 'Última confirmação' : 'Atualizado'} às ${new Date(data.generatedAt).toLocaleTimeString('pt-BR')}` : error ? 'Atualização pendente' : 'Carregando operação…'}</span><button onClick={() => void refresh()} disabled={loading}>Atualizar painel</button><small>Consulta a cada 7 s enquanto esta tela estiver visível.</small></div></div>
    {error && <p className="work-error" role="alert">{error} {data ? 'Os últimos dados confirmados continuam exibidos.' : ''}</p>}
    <div className="ops-guide"><div><strong>Uma apresentação, três responsabilidades.</strong><p>Comercial prepara propostas. Produção registra etapas e movimentos. O proprietário acompanha os saldos e os responsáveis em outra tela.</p>{login && <p>Para abrir a demonstração, <a href={login} target="_blank" rel="noreferrer"><u>entre primeiro na fábrica</u></a> com a mesma conta de demonstração.</p>}</div>{factoryOrigin && <a className="work-button primary" href={`${factoryOrigin}/plugin/acrilchapas/demo/`} target="_blank" rel="noreferrer">Abrir demonstração da fábrica ↗</a>}</div>
    {data && <>
      <section className="ops-metrics" aria-label="Indicadores comerciais">{[
        ['Consultas para analisar', data.metrics.newQuotations, 'quotes'], ['Propostas disponíveis', data.metrics.offeredQuotations, 'quotes'],
        ['Pedidos pagos', data.metrics.paidOrders, 'orders'], ['Pedidos expedidos', data.metrics.fulfilledOrders, 'orders'],
      ].map(([label, value, tab]) => <div className="ops-metric" key={label as string}><span>{label}</span><strong>{value}</strong>{(financial || tab === 'orders' && session.user.role === 'warehouse') && <button onClick={() => onNavigate(tab as string)}>Ver registros →</button>}</div>)}</section>
      <section className="ops-section"><div className="ops-section-heading"><div><h2>Do planejamento à liberação</h2><p>Etapas registradas na demonstração da fábrica.</p></div><span className="ops-tag">{runs.length} ordens de demonstração</span></div>
        {!data.factory.available ? <p className="work-error">A consulta da fábrica está indisponível. Os indicadores comerciais continuam disponíveis; use o acesso da fábrica para conferir a operação.</p> : <><div className="ops-pipeline">{['planned', 'running', 'autoclave', 'quality', 'released'].map(state => <div key={state} data-stage={state}><span>{stages[state]}</span><strong>{runs.filter(r => r.state === state).length}</strong><small>{runs.filter(r => r.state === state).reduce((n, r) => n + r.quantity, 0)} chapas</small></div>)}</div><div className="ops-equipment" aria-label="Autoclaves">{[1, 2, 3].map(machine => { const assigned = runs.filter(r => r.state === 'autoclave' && r.autoclave === machine); return <article key={machine}><strong>Autoclave {machine}</strong><span>{assigned.length ? `${assigned.length} lote(s) registrado(s)` : 'Sem lote registrado'}</span>{assigned.map(r => <small key={r.id}>{r.mold} · {r.quantity} chapas · {r.product}</small>)}</article>; })}</div><div className="ops-run-grid">{runs.map(run => <article key={run.id}><span className={`ops-state ${run.state}`}>{stages[run.state]}</span><h3>{run.code}</h3><p>{run.product}</p><small className="ops-disclosure">{run.recipeName}</small><strong>{run.quantity} chapas</strong>{run.mold && <small className="ops-disclosure">{run.mold}{run.autoclave ? ` · Autoclave ${run.autoclave}` : ' · Aguardando autoclave'}</small>}{factoryOrigin && <a href={`${factoryOrigin}/plugin/acrilchapas/demo/`} target="_blank" rel="noreferrer">Acompanhar na fábrica ↗</a>}</article>)}</div></>}
      </section>
      <section className="ops-section"><div className="ops-section-heading"><div><h2>Estoque sob controle</h2><p>Saldos persistentes, com origem e histórico de movimentações.</p></div><div className="ops-tabs" role="group" aria-label="Tipo de estoque"><button aria-pressed={stockView === 'factory'} onClick={() => setStockView('factory')}>Fábrica</button><button aria-pressed={stockView === 'sales'} onClick={() => setStockView('sales')}>Reservas comerciais</button></div></div>
        {stockView === 'factory' ? <><p className="ops-disclosure">Estoque nativo InvenTree, limitado aos materiais DEMO-OWNER. Receitas usam quantidades de simulação; não constituem formulação industrial aprovada.</p><div className="ops-table"><table><thead><tr><th>Material</th><th>Lote</th><th>Localização</th><th>Saldo</th><th>Histórico</th></tr></thead><tbody>{factoryStock.map(item => <tr key={item.id} data-factory-stock={item.sku}><td><strong>{item.name}</strong><small>{item.sku}</small></td><td>{item.lot}</td><td>{item.location}</td><td><strong data-quantity>{Number(item.quantity).toLocaleString('pt-BR')}</strong> {item.unit || 'un.'}</td><td>{factoryOrigin && <a href={`${factoryOrigin}/web/stock/item/${item.stockId}`} target="_blank" rel="noreferrer">Abrir ↗</a>}</td></tr>)}</tbody></table></div></> : <><p className="ops-disclosure">Saldo comercial de demonstração, separado do estoque nativo da fábrica. Reservar reduz o disponível; expedir reduz o saldo. A sincronização com estoque real ainda depende de homologação.</p><label className="ops-checkbox"><input type="checkbox" checked={allStock} onChange={e => setAllStock(e.target.checked)} />Incluir outros SKUs de teste do ambiente</label><div className="ops-table"><table><thead><tr><th>SKU / medidas</th><th>Saldo</th><th>Reservado</th><th>Disponível</th></tr></thead><tbody>{variants.map(item => <tr key={item.sku} data-sales-stock={item.sku}><td><strong>{item.sku}</strong><small>{item.widthMm} × {item.heightMm} × {item.thicknessMm} mm</small></td><td>{item.onHand}</td><td>{item.reserved}</td><td><strong>{item.available}</strong></td></tr>)}</tbody></table></div>{session.user.role === 'admin' && <button onClick={() => onNavigate('catalog')}>Gerenciar saldos comerciais →</button>}</>}
      </section>
      <div className="ops-bottom"><section className="ops-section"><h2>{financial ? 'Últimas consultas' : 'Pedidos e expedição'}</h2>{financial ? <><p className="ops-disclosure">Registros recentes de todo o ambiente de teste.</p>{data.recentQuotations.map(q => <div className="ops-quote" key={q.reference}><strong>{q.customerName}</strong><span>{statusLabel[q.reviewStatus] || q.reviewStatus}</span><small>{q.itemsCount} materiais · {q.company}</small></div>)}<button onClick={() => onNavigate('quotes')}>Abrir orçamentos →</button></> : data.recentOrders.map(o => <div className="ops-quote" key={o.reference}><strong>{o.reference}</strong><span>{statusLabel[o.status] || o.status}</span><small>{o.productionReady ? 'Atendimento conferido' : 'Aguardando conferência de produção'}</small></div>)}{financial && <p className="ops-financial">Valor dos pedidos de teste <strong>{money(data.metrics.orderValueCents || 0)}</strong></p>}</section>
      <section className="ops-section"><h2>Movimentações e responsáveis</h2><p className="ops-disclosure">Histórico comercial e da fábrica, atualizado automaticamente.</p><ol className="ops-activity">{activity.map((event, index) => <li key={`${event.source}-${event.at}-${index}`}><span>{event.source}</span><strong>{actions[event.action] || 'Atualização registrada'}</strong>{event.change && <p>{event.change}</p>}<small>{event.actor} · {new Date(event.at).toLocaleString('pt-BR')}</small></li>)}</ol></section></div>
    </>}
  </div>;
}
