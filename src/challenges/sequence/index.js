import SequenceStage from './SequenceStage';

const sequence = {
  id: 'sequence',
  slug: 'sequencia',
  code: '02',
  title: 'Sequência',
  points: 200,
  // Speed bonus: full up to fastSeconds, gone at slowSeconds
  fastSeconds: 120,
  slowSeconds: 600,
  objective:
    'O sistema só aceita os seis arquivos na ordem em que foram indexados. Essa ordem não é aleatória.',
  // The answer is produced by interaction (file order), not typed
  answerMode: 'interactive',
  answerHash: 'c98a6251170b6960afa7cf5dead713a1d2042d6c557b2c3a581bccd35ea2c4ea',
  hint: {
    text: 'Repare no que cada imagem mostra e procure uma lógica que as coloque em ordem.',
  },
  success: {
    title: 'Sequência aceita',
    lesson:
      'O alfabeto é uma sequência ordenada: cada letra tem uma posição. A = 0, B = 1, C = 2…',
    nextClue: 'Se cada letra tem uma posição, ela também pode ser deslocada.',
  },
  Stage: SequenceStage,
};

export default sequence;
