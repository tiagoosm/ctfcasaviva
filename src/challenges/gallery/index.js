import GalleryStage from './GalleryStage';

const gallery = {
  id: 'gallery',
  slug: 'galeria',
  code: '01',
  title: 'Galeria',
  points: 200,
  // Speed bonus: full up to fastSeconds, gone at slowSeconds
  fastSeconds: 120,
  slowSeconds: 600,
  objective:
    'Cada imagem carrega uma marca discreta. Junte as marcas na ordem das evidências.',
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
        'Você reconheceu o artista — ótimo olhar! Mas a resposta é formada apenas pelas marcas escondidas nas imagens.',
    },
  ],
  hint: {
    text: 'As marcas são pequenas e se camuflam nas cores da pintura. Percorra cada evidência com calma, dos prédios aos pontos de luz.',
  },
  success: {
    title: 'Marcas identificadas',
    lesson:
      'Esconder informação em imagens é esteganografia: em vez de embaralhar a mensagem, ela disfarça que a mensagem existe.',
    nextClue: 'Guarde a palavra que você encontrou. Ela abre uma porta mais adiante.',
  },
  Stage: GalleryStage,
};

export default gallery;
