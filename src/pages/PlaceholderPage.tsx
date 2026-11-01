import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import { SparklesIcon } from '../components/icons';

export default function PlaceholderPage({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <EmptyState
        icon={<SparklesIcon className="h-6 w-6" />}
        title="Em construção"
        description="Esta parte do plano está sendo preparada para a próxima entrega."
      />
    </div>
  );
}
