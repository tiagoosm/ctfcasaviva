import { Component } from 'react';
import { LuTriangleAlert } from 'react-icons/lu';
import Button from './ui/Button';

// Captura erros de renderização para o jogador nunca cair em uma tela branca.
// O progresso fica salvo, então recarregar ou voltar ao mapa é sempre seguro.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(previousProps) {
    if (this.state.error && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <section className="mx-auto max-w-xl px-4 py-16 sm:px-6" aria-labelledby="erro-titulo">
        <div className="panel p-6 text-center sm:p-8">
          <LuTriangleAlert className="mx-auto h-10 w-10 text-warning" aria-hidden="true" />
          <h1 id="erro-titulo" className="mt-4 text-2xl font-bold">
            Algo saiu do roteiro
          </h1>
          <p className="mt-2 text-fg-muted">
            Encontramos um problema ao exibir esta parte da missão. Seu progresso está salvo — você
            pode tentar novamente ou voltar ao mapa.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
            <Button variant="secondary" onClick={() => window.location.assign('/missao')}>
              Voltar ao mapa
            </Button>
          </div>
        </div>
      </section>
    );
  }
}
