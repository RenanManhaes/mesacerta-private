import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvent } from '@/context/EventContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = ['Básico', 'Público', 'Formato'];

function Choice({ value, selected, onClick, label }) {
  return (
    <button type="button" onClick={() => onClick(value)} className={cn(
      'flex-1 rounded-md border px-4 py-2.5 text-[13px] font-medium transition-all focus-ring',
      selected ? 'border-primary bg-accent text-accent-foreground' : 'border-border bg-card text-foreground hover:border-foreground/30'
    )}>{label}</button>
  );
}

export default function CreateEvent() {
  const { addEvent } = useEvent();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    name: '', date: '', city: '', location: '',
    expectedAudience: '', capacity: '', unsure: false,
    choices: { tickets: null, sponsors: null, suppliers: null, schedule: null, networking: null }
  });

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));
  const setChoice = (k, v) => setData(d => ({ ...d, choices: { ...d.choices, [k]: v } }));

  const canNext = step === 0 ? data.name && data.date : step === 1 ? (data.unsure || data.expectedAudience) : true;

  const finish = () => {
    const c = data.choices;
    const modules = {
      tickets: c.tickets === 'Sim',
      sponsors: c.sponsors === 'Sim',
      suppliers: c.suppliers === 'Sim',
      schedule: c.schedule === 'Sim',
      networking: c.networking === 'Sim'
    };
    const ev = addEvent({
      name: data.name,
      date: data.date,
      city: data.city,
      location: data.location,
      expectedAudience: data.unsure ? 0 : Number(data.expectedAudience) || 0,
      capacity: Number(data.capacity) || 0,
      modules
    });
    navigate(`/event/${ev.id}/dashboard`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-[640px] mx-auto px-5 sm:px-8 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => step === 0 ? navigate('/') : setStep(s => s - 1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-[14px] font-medium">Criar evento</span>
          <span className="ml-auto text-[12px] text-muted-foreground">{step + 1} de {STEPS.length}</span>
        </div>
      </header>

      <main className="max-w-[640px] mx-auto px-5 sm:px-8 py-10">
        <div className="flex gap-1.5 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className={cn('h-0.5 flex-1 rounded-full transition-colors', i <= step ? 'bg-primary' : 'bg-border')} />
          ))}
        </div>

        {step === 0 && (
          <div className="animate-rise">
            <h1 className="font-display text-[26px] tracking-tight">Vamos começar pelo básico.</h1>
            <p className="mt-1 text-[14px] text-muted-foreground">Você pode ajustar tudo isso depois.</p>
            <div className="mt-7 space-y-4">
              <div><Label className="text-[13px]">Nome do evento</Label><Input className="mt-1.5 h-10" placeholder="Ex.: Summit Conecta 2026" value={data.name} onChange={e => set('name', e.target.value)} /></div>
              <div><Label className="text-[13px]">Data</Label><Input type="date" className="mt-1.5 h-10" value={data.date} onChange={e => set('date', e.target.value)} /></div>
              <div><Label className="text-[13px]">Cidade / local</Label><Input className="mt-1.5 h-10" placeholder="Ex.: São Paulo, SP — Centro Empresarial" value={data.city} onChange={e => set('city', e.target.value)} /></div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-rise">
            <h1 className="font-display text-[26px] tracking-tight">Quantas pessoas você imagina receber?</h1>
            <p className="mt-1 text-[14px] text-muted-foreground">É só uma estimativa — o sistema se adapta conforme você avança.</p>
            <div className="mt-7 space-y-4">
              <div className={cn(data.unsure && 'opacity-40 pointer-events-none')}>
                <Label className="text-[13px]">Público previsto</Label>
                <Input type="number" className="mt-1.5 h-10" placeholder="Ex.: 180" value={data.expectedAudience} onChange={e => set('expectedAudience', e.target.value)} disabled={data.unsure} />
              </div>
              <div className={cn(data.unsure && 'opacity-40 pointer-events-none')}>
                <Label className="text-[13px]">Capacidade do espaço <span className="text-muted-foreground font-normal">(se já souber)</span></Label>
                <Input type="number" className="mt-1.5 h-10" placeholder="Ex.: 220" value={data.capacity} onChange={e => set('capacity', e.target.value)} disabled={data.unsure} />
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={data.unsure} onChange={e => set('unsure', e.target.checked)} className="h-4 w-4 rounded border-border accent-[hsl(var(--primary))]" />
                <span className="text-[13px] text-muted-foreground">Ainda não sei.</span>
              </label>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-rise">
            <h1 className="font-display text-[26px] tracking-tight">Como esse evento funciona?</h1>
            <p className="mt-1 text-[14px] text-muted-foreground">Ativamos só os módulos que você precisa. Dá pra mudar depois.</p>
            <div className="mt-7 space-y-5">
              {[
                { key: 'tickets', q: 'O evento tem venda de ingressos?', opts: ['Sim', 'Não', 'Ainda não sei'] },
                { key: 'sponsors', q: 'Terá patrocinadores?', opts: ['Sim', 'Não', 'Talvez'] },
                { key: 'suppliers', q: 'Vai contratar fornecedores?', opts: ['Sim', 'Não'] },
                { key: 'schedule', q: 'Terá programação com palestras, atividades ou intervalos?', opts: ['Sim', 'Não'] },
                { key: 'networking', q: 'Terá rodadas de negócio ou networking?', opts: ['Sim', 'Não'] }
              ].map(row => (
                <div key={row.key} className="border-b border-border pb-5">
                  <div className="text-[13px] font-medium mb-2.5">{row.q}</div>
                  <div className="flex gap-2">
                    {row.opts.map(o => (
                      <Choice key={o} value={o} selected={data.choices[row.key] === o} onClick={() => setChoice(row.key, o)} label={o} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 flex items-center justify-between">
          <Button variant="ghost" onClick={() => step === 0 ? navigate('/') : setStep(s => s - 1)} className="text-[13px]">Voltar</Button>
          {step < STEPS.length - 1 ? (
            <Button disabled={!canNext} onClick={() => setStep(s => s + 1)} className="gap-1.5 text-[13px]">Continuar <ArrowRight className="h-3.5 w-3.5" /></Button>
          ) : (
            <Button onClick={finish} className="gap-1.5 text-[13px]"><Check className="h-3.5 w-3.5" /> Criar evento</Button>
          )}
        </div>
      </main>
    </div>
  );
}
