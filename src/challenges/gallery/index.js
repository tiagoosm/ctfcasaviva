import GalleryStage from './GalleryStage';

const gallery = {
  id: 'gallery',
  slug: 'galeria',
  code: '01',
  title: 'Galeria',
  category: 'Observação',
  skill: 'Análise visual',
  difficulty: 2,
  points: 100,
  summary: 'Quatro obras recuperadas. Alguém deixou marcas nelas.',
  objective:
    'Quatro imagens foram recuperadas de um arquivo suspeito. Cada uma carrega uma marca discreta. Junte as marcas na ordem das evidências para formar a flag.',
  answerMode: 'flag',
  answerHash: '3c59defc470aed151f067e24c11dbac32987a0e1939b5bbe62e20a43130bd40d',
  nearMisses: [
    {
      hashes: [
        'fc8ed028a1b27f0d2403064d91f5626ef2e5016a6280785acae126fc213c3403',
        'b8f20a910f1d279f163efb86669d20967d19193a46fd5a4db021d797dc4e610e',
        'b2e58090201b910be8465e0dd96976ca5781c2e4064f825f997f2ec9ea65184b',
        'aa1f83952bd70d268f5dc8e2784e810d998696c152db7d7bcf8647eac15c94e2',
      ],
      message:
        'Você reconheceu o artista — ótimo olhar! Mas a flag é formada apenas pelas marcas escondidas nas imagens.',
    },
  ],
  hints: [
    {
      cost: 20,
      text: 'As marcas são pequenas e se camuflam nas cores da pintura. Amplie cada evidência e percorra-a com calma, inclusive a arquitetura e os pontos de luz.',
    },
    {
      cost: 30,
      text: 'Cada evidência esconde uma única letra. Procure na parede lateral da igreja, na estrela mais à esquerda, na moldura pendurada na parede do quarto e na torre da pequena igreja.',
    },
  ],
  success: {
    title: 'Marcas identificadas',
    lesson:
      'Esconder informação dentro de imagens é uma técnica chamada esteganografia. Diferente da criptografia, ela não embaralha a mensagem: disfarça que a mensagem existe.',
    nextClue: 'Guarde bem a palavra que você encontrou. Ela vai abrir uma porta mais adiante.',
  },
  Stage: GalleryStage,
};

export default gallery;
