// MCT-79: cada aba do navegador pode ficar em uma conta diferente.
//
// Problema: o Supabase Auth guarda UMA sessão em localStorage e avisa as outras
// abas por BroadcastChannel. Entrar com outra conta numa aba trocava a conta das
// demais.
//
// Solução (só opções públicas do supabase-js: `storage` e `storageKey`):
//
//  1. Sessões por conta, não por navegador. Cada conta tem a própria entrada em
//     localStorage (`<base>:u:<id da conta>`), com a própria cadeia de refresh
//     token. Abas na mesma conta compartilham a entrada, então o token nunca é
//     duplicado entre abas (copiar o refresh token para outra aba faria o
//     Supabase revogar a sessão inteira ao detectar reuso do token).
//  2. Cada aba "fixa" a sua conta em sessionStorage (`<base>:tab`). sessionStorage
//     é por aba e sobrevive ao F5, então recarregar mantém a conta da aba.
//     Entrar numa conta nesta aba só muda a fixação desta aba.
//  3. Aba nova (sem fixação) herda a última conta que entrou no navegador
//     (`<base>:last`). Assim "abrir o site de novo" e links de e-mail/convite
//     abertos em outra aba continuam funcionando sem pedir login à toa.
//  4. Sair (release) remove a conta da aba e a deixa sem conta até novo login:
//     ela NÃO herda a conta de outra aba depois de sair. Sessão que apenas
//     expirou mantém a fixação, para um novo login da mesma conta recuperá-la.
//  5. Sessão antiga, gravada pela versão anterior no formato `<base>`, é migrada
//     na primeira leitura, para ninguém ser deslogado no deploy.
//  6. A SDK cria um BroadcastChannel com o nome do storageKey. `tabAuthStorageKey`
//     devolve um nome único por carregamento da página, então as abas não trocam
//     mensagens de login/logout. O adaptador reconverte esse nome para a chave
//     estável, e o dado gravado não depende dele.
//
//  7. Sair em uma aba remove a entrada da conta, que outras abas da MESMA conta
//     também usam. Essas abas não recebem aviso da SDK (cada uma tem um storageKey
//     próprio), então `onAccountRemoved` ouve o evento `storage` do window: quando
//     some a entrada da conta fixada nesta aba, avisa o app. Abas de outras contas
//     não são afetadas, pois a entrada delas é outra. `announceSignOut` marca que a
//     saída foi de propósito (e não expiração), para o app dizer a mensagem certa.
//
// Chaves que não são a sessão (ex.: verificador PKCE) ficam em localStorage,
// compartilhadas, para que o link do e-mail possa terminar em outra aba.

const NONE = '-'; // aba desconectada de propósito: não herda outra conta
const SIGN_OUT_WINDOW_MS = 15000; // quanto tempo vale a marca de "saí de propósito"

function memoryStorage() {
  const data = new Map();
  return {
    getItem: key => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => { data.set(key, String(value)); },
    removeItem: key => { data.delete(key); },
    key: index => [...data.keys()][index] ?? null,
    get length() { return data.size; },
  };
}

// Devolve o storage se ele funciona (pode lançar em janela privada ou com dados bloqueados).
function usable(getter) {
  try {
    const storage = getter();
    if (!storage) return null;
    const probe = '__mesacerta_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

export function tabAuthStorageKey(base) {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${base}-tab-${random}`;
}

/**
 * @param {string} base chave estável (a mesma que a SDK usaria por padrão)
 * @param {string} instanceKey o storageKey único passado à SDK
 * @param {{shared?: Storage, tab?: Storage}} [stores] para testes
 */
export function createTabAuthStorage(base, instanceKey, stores = {}) {
  const shared = stores.shared ?? usable(() => globalThis.localStorage) ?? memoryStorage();
  const tab = stores.tab ?? usable(() => globalThis.sessionStorage) ?? memoryStorage();
  const entry = id => `${base}:u:${id}`;
  const LAST = `${base}:last`;
  const PIN = `${base}:tab`;
  const OUT = `${base}:out`;

  const normalize = key => (key === instanceKey ? base : key.startsWith(`${instanceKey}-`) ? base + key.slice(instanceKey.length) : key);
  const userId = raw => {
    try { return JSON.parse(raw)?.user?.id || ''; } catch { return ''; }
  };
  const knownUsers = () => {
    const prefix = `${base}:u:`;
    const found = [];
    for (let i = 0; i < shared.length; i++) {
      const key = shared.key(i);
      if (key && key.startsWith(prefix)) found.push(key.slice(prefix.length));
    }
    return found;
  };

  // Conta atual desta aba: fixação -> (aba nova) última conta -> sessão antiga a migrar.
  const resolve = () => {
    const pinned = tab.getItem(PIN);
    if (pinned === NONE) return '';
    if (pinned) return pinned;
    const legacy = shared.getItem(base);
    if (legacy) {
      const id = userId(legacy);
      if (id) {
        if (shared.getItem(entry(id)) === null) shared.setItem(entry(id), legacy);
        shared.removeItem(base);
        if (!shared.getItem(LAST)) shared.setItem(LAST, id);
      }
    }
    const last = shared.getItem(LAST);
    const id = last && shared.getItem(entry(last)) !== null ? last : knownUsers()[0] || '';
    if (id) tab.setItem(PIN, id);
    return id;
  };

  // A marca de saída diz "a conta X saiu de propósito em tal horário".
  const signedOutOnPurpose = id => {
    const [who, at] = String(shared.getItem(OUT) ?? '').split('|');
    return who === id && Date.now() - Number(at) < SIGN_OUT_WINDOW_MS;
  };

  return {
    // Chamar ANTES de sair de propósito: as outras abas da mesma conta saberão que foi um logout.
    announceSignOut() {
      const id = tab.getItem(PIN);
      if (id && id !== NONE) shared.setItem(OUT, `${id}|${Date.now()}`);
    },
    // Avisa quando a entrada da conta desta aba some por ação de OUTRA aba (o evento
    // `storage` só dispara em outras abas). Devolve a função que cancela o aviso.
    onAccountRemoved(callback, target = globalThis.window) {
      if (!target?.addEventListener) return () => {};
      const listener = event => {
        if (event.storageArea && event.storageArea !== shared) return;
        const id = tab.getItem(PIN);
        if (!id || id === NONE) return;
        const removed = event.key === entry(id) ? event.newValue === null : event.key === null; // null = localStorage.clear()
        if (!removed || shared.getItem(entry(id)) !== null) return; // voltou a existir (novo login da mesma conta)
        callback({ deliberate: signedOutOnPurpose(id) });
      };
      target.addEventListener('storage', listener);
      return () => target.removeEventListener('storage', listener);
    },
    // Sair de propósito: esta aba fica sem conta e não herda a de outra aba.
    release() {
      tab.setItem(PIN, NONE);
    },
    getItem(key) {
      const name = normalize(key);
      if (name !== base) return shared.getItem(name);
      const id = resolve();
      return id ? shared.getItem(entry(id)) : null;
    },
    setItem(key, value) {
      const name = normalize(key);
      if (name !== base) { shared.setItem(name, value); return; }
      const id = userId(value) || tab.getItem(PIN);
      if (!id || id === NONE) return;
      shared.setItem(entry(id), value);
      if (tab.getItem(PIN) !== id) {
        // Entrada nova nesta aba: fixa a aba e passa a ser a "última conta".
        tab.setItem(PIN, id);
        shared.setItem(LAST, id);
      }
    },
    removeItem(key) {
      const name = normalize(key);
      if (name !== base) { shared.removeItem(name); return; }
      // A fixação continua: se a sessão sumiu por expirar, entrar de novo na mesma
      // conta, em outra aba, ainda recupera esta aba. Só `release` solta a aba.
      const id = tab.getItem(PIN);
      if (!id || id === NONE) return;
      shared.removeItem(entry(id));
      if (shared.getItem(LAST) === id) {
        const other = knownUsers()[0];
        if (other) shared.setItem(LAST, other); else shared.removeItem(LAST);
      }
    },
  };
}
