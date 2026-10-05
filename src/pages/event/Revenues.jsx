import React, { useState } from 'react';
import { useEvent } from '@/context/EventContext';
import { financialSummary } from '@/lib/selectors';
import { formatBRL, uid } from '@/lib/format';
import {
  PageHeader,
  Kpi,
  Panel,
  Progress,
  Field,
} from '@/components/common/ReferenceUI';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Ticket, Banknote, Plus } from 'lucide-react';

export default function Revenues() {
  const { currentEvent: ev, updateCurrent } = useEvent();
  const [draft, setDraft] = useState(null);
  const fin = financialSummary(ev);
  const patch = (p) => setDraft((d) => ({ ...d, ...p }));
  const lots = ev.tickets.flatMap((t) =>
    t.lots.map((l) => ({ ...l, ticketId: t.id, ticketName: t.name })),
  );
  const save = (e) => {
    e.preventDefault();
    if (draft.kind === 'lot') {
      if (draft.sold > draft.capacity || draft.expectedSales > draft.capacity)
        return;
      const { kind: _kind, ticketId, ticketName, saleDate, ...lot } = draft;
      const previous = lots.find((l) => l.id === lot.id);
      const increase = lot.sold - (previous?.sold || 0);
      updateCurrent((ev) => ({
        ...ev,
        ticketSales:
          saleDate && increase > 0
            ? [
                ...(ev.ticketSales || []),
                {
                  id: uid(),
                  lotId: lot.id,
                  date: saleDate,
                  quantity: increase,
                },
              ]
            : ev.ticketSales,
        tickets: ticketId
          ? ev.tickets.map((t) =>
              t.id === ticketId
                ? {
                    ...t,
                    lots: t.lots.some((l) => l.id === lot.id)
                      ? t.lots.map((l) => (l.id === lot.id ? lot : l))
                      : [...t.lots, lot],
                  }
                : {...t,lots:t.lots.filter(l=>l.id!==lot.id)},
            )
          : [
              ...ev.tickets.map(t=>({...t,lots:t.lots.filter(l=>l.id!==lot.id)})),
              {
                id: uid(),
                name: ticketName || lot.name,
                description: '',
                lots: [lot],
              },
            ],
      }));
    } else {
      if (draft.received > draft.expected) return;
      const { kind: _kind, ...r } = draft;
      updateCurrent((ev) => ({
        ...ev,
        revenues: ev.revenues.some((x) => x.id === r.id)
          ? ev.revenues.map((x) => (x.id === r.id ? r : x))
          : [...ev.revenues, r],
      }));
    }
    setDraft(null);
  };
  const newLot = () =>
    setDraft({
      kind: 'lot',
      id: uid(),
      name: '',
      ticketId: '',
      ticketName: '',
      price: 0,
      sold: 0,
      expectedSales: 0,
      capacity: 0,
      limitDate: '',
      startDate: '',
    });
  const newRevenue = () =>
    setDraft({
      kind: 'revenue',
      id: uid(),
      description: '',
      category: 'Outros',
      expected: 0,
      received: 0,
      expectedDate: '',
      receivedDate: '',
      status: 'previsto',
    });
  // Aggregate sold counts have no historic sale dates. Show recorded dated sales only.
  const sales = (ev.ticketSales || []).filter(
    (s) =>
      new Date(s.date + 'T12:00:00') >= new Date(Date.now() - 30 * 86400000),
  );
  const points = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 29 + i);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return sales
      .filter((s) => s.date === date)
      .reduce((a, s) => a + s.quantity, 0);
  });
  const max = Math.max(1, ...points);
  return (
    <div className="reference-page">
      <PageHeader
        eyebrow="Financeiro"
        title="Receitas"
        subtitle="Lotes de ingressos e outras entradas do evento."
        actions={
          <Button onClick={newLot}>
            <Plus size={16} />
            Nova receita
          </Button>
        }
      />
      <div className="reference-grid-3">
        <Kpi
          icon={Ticket}
          label="Ingressos vendidos"
          value={fin.ticketSold}
          sub={`de ${fin.ticketCapacity} disponíveis`}
        />
        <Kpi
          icon={Banknote}
          label="Receita de ingressos"
          value={fin.ticketReceived}
          format={formatBRL}
          sub={`Ticket médio ${formatBRL(fin.ticketSold ? fin.ticketReceived / fin.ticketSold : 0)}`}
        />
        <Panel title="Vendas nos últimos 30 dias">
          {sales.length ? (
            <svg
              viewBox="0 0 300 60"
              className="w-full h-16"
              role="img"
              aria-label="Vendas registradas por dia"
            >
              <polyline
                points={points
                  .map((v, i) => `${(i / 29) * 298 + 1},${58 - (v / max) * 55}`)
                  .join(' ')}
                fill="none"
                stroke="#e8663d"
                strokeWidth="2"
              />
            </svg>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sem histórico diário registrado. Os totais vendidos aparecem nos
              lotes abaixo.
            </p>
          )}
        </Panel>
      </div>
      <div className="platform-kpis">
        {lots.map((l) => {
          const status =
            l.capacity > 0 && l.sold >= l.capacity
              ? 'Esgotado'
              : l.startDate &&
                  l.startDate > new Date().toISOString().slice(0, 10)
                ? 'Agendado'
                : 'À venda';
          return (
            <button
              key={l.id}
              className="platform-panel reference-lot"
              onClick={() => setDraft({ ...l, kind: 'lot' })}
            >
              <header>
                <h2>{l.name === 'Único' ? l.ticketName : l.name}</h2>
                <span
                  className={`reference-tag ${status === 'Esgotado' ? 'positive' : ''}`}
                >
                  ● {status}
                </span>
              </header>
              <strong>{formatBRL(l.price)}</strong>
              <div>
                <div className="reference-progress-label">
                  <span>Vendidos</span>
                  <b>
                    {l.sold} / {l.capacity}
                  </b>
                </div>
                <Progress
                  value={l.sold}
                  total={l.capacity}
                  tone={status === 'Esgotado' ? 'green' : 'blue'}
                />
              </div>
              <small>
                Total: <b>{formatBRL(l.price * l.sold)}</b>
              </small>
            </button>
          );
        })}
      </div>
      <Panel
        title="Outras receitas"
        extra={
          <Button variant="outline" size="sm" onClick={newRevenue}>
            <Plus size={14} />
            Outra receita
          </Button>
        }
      >
        {ev.revenues.map((r) => (
          <button
            key={r.id}
            className="reference-list-row"
            onClick={() => setDraft({ ...r, kind: 'revenue' })}
          >
            <span>
              <b>{r.description}</b>
              <small>{r.category}</small>
            </span>
            <span className="text-right">
              <b>{formatBRL(r.expected)}</b>
              <small>{formatBRL(r.received)} recebido</small>
            </span>
          </button>
        ))}
      </Panel>
      <Dialog
        open={!!draft}
        onOpenChange={(v) => {
          if (!v) setDraft(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {draft?.kind === 'lot' ? 'Lote de ingressos' : 'Outra receita'}
            </DialogTitle>
          </DialogHeader>
          {draft && (
            <form onSubmit={save} className="space-y-4">
              {draft.kind === 'lot' ? (
                <>
                  <Field
                    label="Nome do lote"
                    required
                    value={draft.name}
                    onChange={(name) => patch({ name })}
                  />
                  <label className="reference-field">
                    Ingresso
                    <select
                      value={draft.ticketId}
                      onChange={(e) => patch({ ticketId: e.target.value })}
                    >
                      <option value="">Novo tipo de ingresso</option>
                      {ev.tickets.map((t) => (
                        <option value={t.id} key={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {!draft.ticketId && (
                    <Field
                      label="Nome do ingresso"
                      value={draft.ticketName}
                      required
                      onChange={(ticketName) => patch({ ticketName })}
                    />
                  )}
                  <div className="reference-grid-2">
                    {[
                      ['Preço (R$)', 'price'],
                      ['Capacidade', 'capacity'],
                      ['Vendidos', 'sold'],
                      ['Vendas previstas', 'expectedSales'],
                    ].map(([label, key]) => (
                      <Field
                        key={key}
                        label={label}
                        type="number"
                        min={0}
                        max={
                          ['sold', 'expectedSales'].includes(key)
                            ? draft.capacity
                            : undefined
                        }
                        value={draft[key]}
                        onChange={(v) =>
                          patch({ [key]: key === 'price' ? v : Math.floor(v) })
                        }
                      />
                    ))}
                    <Field
                      label="Início das vendas"
                      type="date"
                      value={draft.startDate}
                      onChange={(startDate) => patch({ startDate })}
                    />
                    <Field
                      label="Limite das vendas"
                      type="date"
                      value={draft.limitDate}
                      onChange={(limitDate) => patch({ limitDate })}
                    />
                    <Field
                      label="Data das novas vendas (opcional)"
                      type="date"
                      value={draft.saleDate}
                      onChange={(saleDate) => patch({ saleDate })}
                    />
                    <Field
                      label="Data do recebimento"
                      type="date"
                      value={draft.receivedDate}
                      onChange={(receivedDate) => patch({ receivedDate })}
                    />
                  </div>
                </>
              ) : (
                <>
                  <Field
                    label="Descrição"
                    required
                    value={draft.description}
                    onChange={(description) => patch({ description })}
                  />
                  <Field
                    label="Categoria"
                    value={draft.category}
                    onChange={(category) => patch({ category })}
                  />
                  <div className="reference-grid-2">
                    <Field
                      label="Valor previsto (R$)"
                      type="number"
                      min={0}
                      value={draft.expected}
                      onChange={(expected) => patch({ expected })}
                    />
                    <Field
                      label="Valor recebido (R$)"
                      type="number"
                      min={0}
                      max={draft.expected}
                      value={draft.received}
                      onChange={(received) =>
                        patch({
                          received,
                          status:
                            received >= draft.expected
                              ? 'recebido'
                              : 'previsto',
                        })
                      }
                    />
                    <Field
                      label="Data prevista"
                      type="date"
                      value={draft.expectedDate}
                      onChange={(expectedDate) => patch({ expectedDate })}
                    />
                    <Field
                      label="Data recebida"
                      type="date"
                      value={draft.receivedDate}
                      onChange={(receivedDate) => patch({ receivedDate })}
                    />
                  </div>
                </>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDraft(null)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
