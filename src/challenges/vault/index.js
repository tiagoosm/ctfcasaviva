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
    'O fim da investigação está atrás desta porta. A combinação tem 4 dígitos, e tudo o que você precisa para chegar a ela está no próprio cofre.',
  // The combination is typed on the stage keypad
  answerMode: 'interactive',
  // A 4-digit combination has only 10,000 possibilities, so no hash of it is
  // shipped with the site: this answer is checked by the server alone
  serverOnly: true,
  codeLength: 4,
  hint: {
    text: 'As três pistas são etapas de um mesmo caminho: o que você observa precisa ser decifrado antes de virar número.',
  },
  success: {
    title: 'Cofre aberto',
    lesson:
      'Observar, decifrar e converter: você juntou tudo o que aprendeu na missão para chegar à combinação.',
  },
  Stage: VaultStage,
};

export default vault;
