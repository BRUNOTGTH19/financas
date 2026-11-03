import { useRef, useState } from 'react';
import { backupFileName, downloadBackup, parseBackup } from '../lib/backup';
import { formatCents } from '../lib/money';
import type { FinanceBackup } from '../schemas/backup';
import { useFinanceStore } from '../store/financeStore';
import Modal from './Modal';
import { DownloadIcon, UploadIcon } from './icons';

interface PendingImport {
  backup: FinanceBackup;
  fileName: string;
}

function readFileAsText(file: File): Promise<string> {
  if (typeof file.text === 'function') return file.text();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export default function BackupPanel({ onImported }: { onImported?: () => void }) {
  const incomes = useFinanceStore((state) => state.incomes);
  const fixedExpenses = useFinanceStore((state) => state.fixedExpenses);
  const expenses = useFinanceStore((state) => state.expenses);
  const savingsGoal = useFinanceStore((state) => state.settings.savingsGoal);
  const replaceData = useFinanceStore((state) => state.replaceData);
  const mergeData = useFinanceStore((state) => state.mergeData);

  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingImport | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const data = {
    incomes,
    fixedExpenses,
    expenses,
    settings: { savingsGoal },
  };

  function handleExport() {
    setError('');
    setNotice('');

    try {
      downloadBackup(data);
      setNotice(`Backup exportado como ${backupFileName()}.`);
    } catch {
      setError('Não foi possível gerar o arquivo de backup.');
    }
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    setError('');
    setNotice('');
    setPending(null);
    setConfirmReplace(false);

    if (!file) return;

    try {
      const raw = await readFileAsText(file);
      const result = parseBackup(raw);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setPending({ backup: result.backup, fileName: file.name });
    } catch {
      setError('Não foi possível ler o arquivo selecionado.');
    }
  }

  function closeDialog() {
    setPending(null);
    setConfirmReplace(false);
  }

  function applyImport(mode: 'merge' | 'replace') {
    if (!pending) return;

    if (mode === 'replace') {
      replaceData(pending.backup.data);
      setNotice('Backup importado: os dados anteriores foram substituídos.');
    } else {
      mergeData(pending.backup.data);
      setNotice('Backup mesclado sem duplicar registros já existentes.');
    }

    closeDialog();
    onImported?.();
  }

  return (
    <section className="card card-pad" aria-labelledby="backup-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-ink/35">
            Portabilidade
          </p>
          <h2 id="backup-title" className="mt-1 text-lg font-extrabold tracking-tight">
            Backup em JSON
          </h2>
          <p className="mt-1 max-w-xl text-xs font-medium leading-relaxed text-ink/45">
            Exporte uma cópia dos dados para guardar fora do navegador. A importação valida o
            arquivo antes de alterar rendas, fixos, gastos ou meta.
          </p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300">
          <DownloadIcon className="h-[18px] w-[18px]" />
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-2 border-t border-ink/[0.05] pt-4 sm:flex-row">
        <button type="button" className="btn-primary btn-sm self-start" onClick={handleExport}>
          <DownloadIcon className="h-4 w-4" />
          Exportar backup
        </button>
        <button
          type="button"
          className="btn-ghost btn-sm self-start"
          onClick={() => inputRef.current?.click()}
        >
          <UploadIcon className="h-4 w-4" />
          Importar backup
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label="Arquivo de backup JSON"
          onChange={handleFile}
        />
        <p className="text-xs font-semibold text-ink/35 sm:ml-auto sm:self-center">
          {incomes.length} {incomes.length === 1 ? 'renda' : 'rendas'} · {fixedExpenses.length}{' '}
          {fixedExpenses.length === 1 ? 'fixo' : 'fixos'} · {expenses.length}{' '}
          {expenses.length === 1 ? 'gasto' : 'gastos'}
        </p>
      </div>

      {error ? (
        <p role="alert" className="error-text">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="mt-2 text-xs font-semibold text-brand-700 dark:text-brand-300">
          {notice}
        </p>
      ) : null}

      {pending ? (
        <Modal
          title="Importar backup"
          description={`O arquivo ${pending.fileName} foi validado. Escolha como aplicar os dados.`}
          onClose={closeDialog}
        >
          <div className="rounded-2xl border border-ink/[0.06] bg-cream/50 p-4">
            <p className="text-sm font-extrabold tracking-tight">Conteúdo do arquivo</p>
            <p className="mt-1 text-xs font-semibold text-ink/45">
              {pending.backup.data.incomes.length}{' '}
              {pending.backup.data.incomes.length === 1 ? 'renda' : 'rendas'} ·{' '}
              {pending.backup.data.fixedExpenses.length}{' '}
              {pending.backup.data.fixedExpenses.length === 1 ? 'fixo' : 'fixos'} ·{' '}
              {pending.backup.data.expenses.length}{' '}
              {pending.backup.data.expenses.length === 1 ? 'gasto' : 'gastos'} · meta de{' '}
              {formatCents(pending.backup.data.settings.savingsGoal)}
            </p>
          </div>

          {confirmReplace ? (
            <>
              <p
                role="alert"
                className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-xs font-semibold leading-relaxed text-rose-900 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-100"
              >
                Substituir apaga todos os dados atuais deste navegador. A ação não pode ser
                desfeita.
              </p>
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setConfirmReplace(false)}
                >
                  Voltar
                </button>
                <button type="button" className="btn-danger" onClick={() => applyImport('replace')}>
                  Confirmar substituição
                </button>
              </div>
            </>
          ) : (
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" className="btn-ghost" onClick={closeDialog}>
                Cancelar
              </button>
              <button type="button" className="btn-ghost" onClick={() => setConfirmReplace(true)}>
                Substituir tudo
              </button>
              <button type="button" className="btn-primary" onClick={() => applyImport('merge')}>
                Mesclar
              </button>
            </div>
          )}
        </Modal>
      ) : null}
    </section>
  );
}
