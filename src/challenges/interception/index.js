import InterceptionStage from './InterceptionStage';

const interception = {
  id: 'interception',
  slug: 'interceptacao',
  code: '03',
  title: 'Interceptação',
  category: 'Criptografia',
  skill: 'Cifra de substituição',
  difficulty: 3,
  points: 200,
  summary: 'Um relato histórico com algo que não se encaixa.',
  objective:
    'Interceptamos um relato histórico. Em algum ponto dele, alguém inseriu uma palavra cifrada com o mesmo método que o texto descreve. Encontre-a e decifre-a.',
  answerMode: 'flag',
  answerHash: 'ee0cef5a78e7c6e17625d7cc4caec4888fdbcaa43b5e2da4b61a17d7f5e4d452',
  nearMisses: [
    {
      hashes: [
        'fcb3d0496974dcf69b65f8fff2446732d9c43e93779b9cbceeb53e0bc3c261ed',
      ],
      message: 'Você encontrou a palavra infiltrada! Agora ela precisa ser decifrada.',
    },
    {
      hashes: [
        '94851ec6daf9ff7334f1c15550bb2e7ad4a817e03a8faaf94f34e95be5ab0eb2',
        'fe24514a242a32166832422c53b5c99731dcfbbb25860a20f3abe7a234d1cafe',
        '41dd108bdaa4eb9279d359ec532a5d15474f8236665fb6ab5e9548378e4ec4cd',
        '8f8cc9e5726d6229021fa7c2281ac22f32c639ebee3aeb48c813b945724295cc',
      ],
      message: 'Esse é o método, não a mensagem. Use-o para decifrar a palavra suspeita.',
    },
  ],
  hints: [
    {
      cost: 40,
      text: 'Leia com atenção: uma das palavras do texto não pertence a nenhum idioma.',
    },
    {
      cost: 60,
      text: 'Quem comandou as Guerras Gálicas deu nome ao método: cada letra é trocada pela que está 3 posições à frente no alfabeto. Para decifrar, volte 3 posições.',
    },
  ],
  success: {
    title: 'Transmissão decifrada',
    lesson:
      'Você quebrou uma Cifra de César: cada letra avança um número fixo de posições (aqui, 3). Como usa um único deslocamento, ela tem só 25 chaves possíveis — basta testar todas.',
    nextClue:
      'E se, em vez de um deslocamento fixo, cada letra usasse um deslocamento diferente? É exatamente isso que protege o cofre.',
  },
  Stage: InterceptionStage,
};

export default interception;
