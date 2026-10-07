// Assinatura Realtime do sinal leve de mudança (tabela event_change_signals, MCT-85).
// O sinal só diz "o evento X está na revisão N"; os dados continuam vindo de event_list, já com a projeção do papel.
let sequence = 0;
const PROBLEMS = ['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'];

// Devolve a função que encerra a assinatura (remove o canal; chame ao trocar de evento ou desmontar).
export function watchEventSignals({ client, eventIds, onSignal, onSubscribed = () => {}, onProblem = (_status, _error) => {} }) {
  const channel = client.channel(`event-signals-${++sequence}-${Math.random().toString(36).slice(2, 8)}`);
  for (const id of eventIds) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'event_change_signals', filter: `event_id=eq.${id}` },
      (payload) => {
        const row = payload?.new;
        if (row?.event_id) onSignal({ eventId: row.event_id, revision: Number(row.revision) });
      },
    );
  }
  channel.subscribe((status, error) => {
    if (status === 'SUBSCRIBED') onSubscribed();
    else if (PROBLEMS.includes(status)) onProblem(status, error);
  });
  return () => { client.removeChannel(channel); };
}
