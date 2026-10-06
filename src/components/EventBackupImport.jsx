import { useState } from 'react';
import { useEvent } from '@/context/EventContext';

// File-based migration only: event data is never read from browser storage.
export default function EventBackupImport() {
  const { importBackup } = useEvent();
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const load = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      importBackup(JSON.parse(await file.text()));
      setError(false);
      setMessage('Backup importado. Aguarde o salvamento; uma falha aparecerá com a opção de tentar novamente.');
    } catch (err) {
      setError(true);
      setMessage(err.message);
    }
    e.target.value = '';
  };
  return <details className="mt-6 text-sm">
    <summary>Recuperar eventos de um backup anterior</summary>
    <p className="my-2 text-muted-foreground">Selecione o arquivo JSON exportado pela versão anterior. Eventos existentes não serão substituídos.</p>
    <label>Arquivo de backup <input type="file" accept=".json,application/json" onChange={load} /></label>
    {message && <p role={error ? 'alert' : 'status'}>{message}</p>}
  </details>;
}
