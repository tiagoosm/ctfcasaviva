import InterceptionStage from './InterceptionStage';

const interception = {
  id: 'interception',
  slug: 'interceptacao',
  code: '03',
  title: 'Interceptação',
  points: 200,
  // Speed bonus: full up to fastSeconds, gone at slowSeconds
  fastSeconds: 180,
  slowSeconds: 720,
  objective:
    'Há uma palavra cifrada infiltrada neste relato, com o mesmo método que ele descreve. Encontre-a e decifre-a.',
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
  hint: {
    text: 'Uma das palavras do relato não pertence a nenhum idioma. Quem comandou as Guerras Gálicas dá nome à cifra usada nela.',
  },
  success: {
    title: 'Transmissão decifrada',
    lesson:
      'Você quebrou uma Cifra de César: cada letra avança um número fixo de posições (aqui, 3).',
    nextClue: 'E se cada letra usasse um deslocamento diferente? É isso que protege o cofre.',
  },
  Stage: InterceptionStage,
};

export default interception;
