import SequenceStage from './SequenceStage';

const sequence = {
  id: 'sequence',
  slug: 'sequencia',
  code: '02',
  title: 'Sequência',
  category: 'Lógica',
  skill: 'Reconhecimento de padrões',
  difficulty: 2,
  points: 150,
  summary: 'Seis arquivos, uma única ordem de ativação.',
  objective:
    'Um sistema legado protege a próxima porta. Ele só aceita os seis arquivos na ordem em que foram indexados. A ordem não é aleatória — repare em como o painel de ativação foi organizado.',
  // The answer is produced by interaction (file order), not typed
  answerMode: 'interactive',
  answerHash: 'c98a6251170b6960afa7cf5dead713a1d2042d6c557b2c3a581bccd35ea2c4ea',
  hints: [
    {
      cost: 30,
      text: 'Os espaços do painel de ativação não são numerados. Por que um sistema de arquivos usaria essas marcações?',
    },
    {
      cost: 45,
      text: 'Dê um nome simples, em português, a cada imagem. A primeira letra de cada nome indica o espaço em que ela deve entrar.',
    },
  ],
  success: {
    title: 'Sequência aceita',
    lesson:
      'Encontrar o padrão por trás de dados aparentemente soltos é o coração da análise de segurança. E repare: o alfabeto é uma sequência ordenada — cada letra tem uma posição. A = 0, B = 1, C = 2…',
    nextClue: 'Se cada letra tem uma posição, ela também pode ser deslocada. Leve essa ideia para a próxima fase.',
  },
  Stage: SequenceStage,
};

export default sequence;
