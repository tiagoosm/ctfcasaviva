import { LuCompass } from 'react-icons/lu';
import Button from '../components/ui/Button';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function NotFoundPage() {
  useDocumentTitle('Página não encontrada');

  return (
    <section className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
      <LuCompass className="mx-auto h-12 w-12 text-brand-orange" aria-hidden="true" />
      <p className="eyebrow mt-6">Erro 404</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Esta rota não faz parte da missão</h1>
      <p className="mt-3 text-fg-muted">
        O endereço pode ter sido digitado errado ou a página não existe mais. Nenhuma flag está
        escondida aqui — prometemos.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button to="/missao">Ir para o mapa da missão</Button>
        <Button to="/" variant="secondary">
          Página inicial
        </Button>
      </div>
    </section>
  );
}
