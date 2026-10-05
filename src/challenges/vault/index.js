import VaultStage from './VaultStage';

const vault = {
  id: 'vault',
  slug: 'cofre',
  code: 'FINAL',
  title: 'O Cofre',
  points: 300,
  // Speed bonus: full up to fastSeconds, gone at slowSeconds
  fastSeconds: 240,
  slowSeconds: 900,
  objective:
    'O arquivo final está trancado no cofre. Analise os documentos da sala e descubra a combinação de 4 dígitos.',
  // The combination is typed on the vault keypad
  answerMode: 'interactive',
  // A 4-digit combination has only 10,000 possibilities, so no hash of it is
  // shipped with the site: this answer is checked by the server alone
  serverOnly: true,
  codeLength: 4,
  hint: {
    text: 'Nem todo documento foi feito para revelar uma resposta. Alguns existem para esconder o que realmente importa.',
  },
  success: {
    title: 'Acesso concedido',
    lesson:
      'Separar o que importa do que é ruído, decodificar e ligar as pistas: foi isso que abriu o cofre.',
  },
  Stage: VaultStage,
};

export default vault;
