export function incorrectFeedback(result) {
  if (result.message) {
    return { key: Date.now(), tone: 'info', title: 'Você está no caminho', message: result.message };
  }
  return {
    key: Date.now(),
    tone: 'error',
    title: 'Resposta incorreta',
    message: 'Revise as pistas e tente de novo.',
  };
}

export function systemErrorFeedback() {
  return {
    key: Date.now(),
    tone: 'error',
    title: 'Não foi possível verificar',
    message: 'Tente enviar de novo.',
  };
}
