import { z } from 'zod';
import { persistedStateSchema } from './finance';

export const BACKUP_VERSION = 1;

export const backupSchema = z.object({
  version: z.literal(BACKUP_VERSION, {
    error: 'Versão de backup incompatível. Este app aceita a versão 1.',
  }),
  exportedAt: z.iso.datetime({ error: 'Data de exportação inválida.' }),
  data: persistedStateSchema,
});

export type FinanceBackup = z.infer<typeof backupSchema>;
