import Button from '../components/ui/Button';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function NotFoundPage() {
  useDocumentTitle('Página não encontrada');

  return (
    <section className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
      {/* An empty spot on the board */}
      <p className="note mx-auto w-40 -rotate-3 px-4 py-5 font-hand text-2xl" aria-hidden="true">
        nada aqui…
      </p>
      <p className="eyebrow mt-10">Erro 404</p>
      <h1 className="display-wide mt-4 text-3xl font-black uppercase leading-tight sm:text-4xl">
        Esta rota não faz parte da missão
      </h1>
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
