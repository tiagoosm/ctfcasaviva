import BriefingStage from './BriefingStage';

const briefing = {
  id: 'briefing',
  slug: 'briefing',
  code: '00',
  title: 'Briefing',
  category: 'Introdução',
  skill: 'Leitura atenta',
  difficulty: 1,
  points: 50,
  summary: 'Seu primeiro acesso. Aprenda como uma flag funciona.',
  objective:
    'O dossiê abaixo contém a senha deste primeiro acesso, mas ela foi censurada. Encontre-a e envie como flag.',
  answerMode: 'flag',
  answerHash: '6ce4f9112a99d646418c98daa051fdbbe9f452b6a934308fd5109f6ea888224a',
  nearMisses: [
    {
      hashes: [
        'e4ff48f659969ee134f6f98998c7a47c3bbac0830fee8136544c63347e4d421b',
      ],
      message:
        'Esse é só o prefixo do formato. A resposta que vai entre as chaves está escondida no dossiê.',
    },
    {
      hashes: [
        '44d8899db0eb91460c15c83479c1858885387f63201dd9ee59368120798a4d99',
        '631114a9732ff57949997ce67ee94f2c49fe527d752e769b56e70f001d3582ad',
      ],
      message: 'Quase lá: você precisa do conteúdo da senha, não do nome do campo.',
    },
  ],
  hints: [
    {
      cost: 10,
      text: 'Em documentos digitais, uma tarja preta nem sempre apaga o que está por baixo. Às vezes ela só esconde.',
    },
    {
      cost: 15,
      text: 'Selecione o texto do documento: arraste o cursor sobre as tarjas, use Ctrl+A ou, no celular, toque e segure sobre elas.',
    },
  ],
  success: {
    title: 'Acesso liberado',
    lesson:
      'Uma tarja visual não apaga um dado — apenas o esconde. Vazamentos reais já aconteceram assim: documentos "censurados" em que a informação continuava lá, bastando selecionar o texto.',
    nextClue: 'Na próxima fase, os segredos não estão no texto, e sim nas imagens. Olhe de perto.',
  },
  Stage: BriefingStage,
};

export default briefing;
