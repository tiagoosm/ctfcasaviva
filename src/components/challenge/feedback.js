// Mensagens de erro variam a cada tentativa para o jogador perceber que o
// sistema reagiu ao novo envio, sem nunca entregar a resposta.
const INCORRECT_MESSAGES = [
  'Essa não parece ser a solução. Analise novamente as pistas.',
  'Ainda não. Revise o que você já observou e teste outra hipótese.',
  'Não foi dessa vez. Talvez algum detalhe tenha passado despercebido.',
  'Resposta recusada. Volte ao objetivo e confira o que ele pede exatamente.',
];

export function incorrectFeedback(result, wrongCount) {
  if (result.message) {
    return { key: Date.now(), tone: 'info', title: 'Você está no caminho', message: result.message };
  }
  return {
    key: Date.now(),
    tone: 'error',
    title: 'Resposta incorreta',
    message: INCORRECT_MESSAGES[wrongCount % INCORRECT_MESSAGES.length],
  };
}

export function systemErrorFeedback() {
  return {
    key: Date.now(),
    tone: 'error',
    title: 'Não foi possível verificar',
    message: 'Algo falhou ao validar sua resposta. Tente enviar de novo.',
  };
}
