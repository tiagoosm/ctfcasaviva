import BriefingStage from './BriefingStage';

const briefing = {
  id: 'briefing',
  slug: 'briefing',
  code: '00',
  title: 'Briefing',
  points: 50,
  objective:
    'A senha do primeiro acesso foi censurada no dossiê. Encontre-a.',
  answerMode: 'flag',
  answerHash: '6ce4f9112a99d646418c98daa051fdbbe9f452b6a934308fd5109f6ea888224a',
  nearMisses: [
    {
      hashes: [
        '44d8899db0eb91460c15c83479c1858885387f63201dd9ee59368120798a4d99',
        '631114a9732ff57949997ce67ee94f2c49fe527d752e769b56e70f001d3582ad',
      ],
      message: 'Quase lá: você precisa do conteúdo da senha, não do nome do campo.',
    },
  ],
  hint: {
    cost: 10,
    text: 'Em documentos digitais, uma tarja preta nem sempre apaga o que está por baixo. Às vezes ela só esconde.',
  },
  success: {
    title: 'Acesso liberado',
    lesson:
      'Uma tarja visual não apaga um dado, só o esconde. Vazamentos reais já aconteceram assim.',
    nextClue: 'Na próxima fase, os segredos estão nas imagens.',
  },
  Stage: BriefingStage,
};

export default briefing;
