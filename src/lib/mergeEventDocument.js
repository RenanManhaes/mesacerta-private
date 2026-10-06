// Junção em 3 vias (base, minha, deles) do documento JSON de um evento.
// Função pura: não altera as entradas e não depende de React nem de rede.
// Retorna { document, conflicts: [{ path, mine, theirs }] }; em conflito, vale a minha versão.

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

export function sameValue(a, b) {
  if (a === b) return true;
  if (Array.isArray(a)) {
    return Array.isArray(b) && a.length === b.length && a.every((v, i) => sameValue(v, b[i]));
  }
  if (isObject(a) && isObject(b)) {
    const keys = Object.keys(a).filter((k) => a[k] !== undefined);
    const other = Object.keys(b).filter((k) => b[k] !== undefined);
    return keys.length === other.length && keys.every((k) => sameValue(a[k], b[k]));
  }
  return false;
}

// Lista "com id": todo item é objeto com id textual/numérico e não há ids repetidos.
function isIdList(list) {
  if (!Array.isArray(list)) return false;
  const seen = new Set();
  for (const item of list) {
    if (!isObject(item) || (typeof item.id !== 'string' && typeof item.id !== 'number')) return false;
    if (seen.has(item.id)) return false;
    seen.add(item.id);
  }
  return true;
}

function mergeValue(base, mine, theirs, path, conflicts) {
  if (sameValue(mine, theirs)) return mine;
  if (sameValue(mine, base)) return theirs;
  if (sameValue(theirs, base)) return mine;
  // Aqui os dois lados mudaram, e de forma diferente.
  if (mine === undefined) {
    // Removi, mas a outra pessoa modificou: mantém a versão modificada.
    conflicts.push({ path, mine, theirs });
    return theirs;
  }
  if (theirs === undefined) {
    conflicts.push({ path, mine, theirs });
    return mine;
  }
  if (isObject(mine) && isObject(theirs)) {
    return mergeObject(isObject(base) ? base : {}, mine, theirs, path, conflicts);
  }
  if (Array.isArray(mine) && Array.isArray(theirs)) {
    const baseList = base === undefined ? [] : base;
    if (isIdList(mine) && isIdList(theirs) && isIdList(baseList)) {
      return mergeIdList(baseList, mine, theirs, path, conflicts);
    }
  }
  conflicts.push({ path, mine, theirs });
  return mine;
}

function mergeObject(base, mine, theirs, path, conflicts) {
  const result = {};
  const keys = [...Object.keys(theirs), ...Object.keys(mine).filter((k) => !(k in theirs))];
  for (const key of keys) {
    const merged = mergeValue(base[key], mine[key], theirs[key], path ? `${path}.${key}` : key, conflicts);
    if (merged !== undefined) result[key] = merged;
  }
  return result;
}

function mergeIdList(base, mine, theirs, path, conflicts) {
  const byId = (list) => new Map(list.map((item) => [item.id, item]));
  const baseMap = byId(base);
  const mineMap = byId(mine);
  const theirsMap = byId(theirs);
  const itemPath = (id) => `${path}[${id}]`;
  const result = [];
  // Ordem estável: a ordem deles; itens só meus entram depois, na minha ordem.
  for (const item of theirs) {
    const id = item.id;
    const mineItem = mineMap.get(id);
    const baseItem = baseMap.get(id);
    if (mineItem === undefined) {
      if (baseItem === undefined) result.push(item); // adição deles
      else if (sameValue(item, baseItem)) continue; // removi e eles não tocaram: continua removido
      else {
        conflicts.push({ path: itemPath(id), mine: undefined, theirs: item });
        result.push(item); // removi, mas eles modificaram: fica a versão modificada
      }
      continue;
    }
    result.push(mergeValue(baseItem, mineItem, item, itemPath(id), conflicts));
  }
  for (const item of mine) {
    const id = item.id;
    if (theirsMap.has(id)) continue;
    const baseItem = baseMap.get(id);
    if (baseItem === undefined) result.push(item); // adição minha
    else if (sameValue(item, baseItem)) continue; // eles removeram e eu não toquei: continua removido
    else {
      conflicts.push({ path: itemPath(id), mine: item, theirs: undefined });
      result.push(item); // eles removeram, mas eu modifiquei: fica a minha versão
    }
  }
  return result;
}

export function mergeEventDocument(base, mine, theirs) {
  const conflicts = [];
  const document = mergeValue(base ?? {}, mine, theirs, '', conflicts);
  return { document, conflicts };
}
