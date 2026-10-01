import VaultStage from './VaultStage';

const vault = {
  id: 'vault',
  slug: 'cofre',
  code: 'FINAL',
  title: 'O Cofre',
  points: 300,
  objective:
    'Cada letra usa um deslocamento diferente, definido por uma chave de 4 letras que se repete. Você já encontrou essa chave.',
  answerMode: 'flag',
  answerHash: '457ed97614e3e0c5bb706a03007bbc60c0dd5ada44451e0002627323309d45e5',
  ciphertext: 'ICTXAWYAG',
  keyLength: 4,
  nearMisses: [
    {
      hashes: [
        'bd2c6dab8e511838efa14b86f3dc3f53f8b6433cc7d944620de050f2a8fe8923',
      ],
      message: 'Essa é a chave! Agora use-a para decifrar a mensagem do cofre.',
    },
    {
      hashes: [
        '3aed2e44efd29c6a838900bc085f71a98d1444e1a83eebb44c9f65e3903e49f4',
      ],
      message: 'Essa é a mensagem ainda cifrada. Decifre-a antes de enviar.',
    },
    {
      hashes: [
        '44cf57bde41613512ee6a8b6e312f60884f922f0e2e9757f7bef568fda318b9b',
      ],
      message: 'Essa era a resposta da transmissão anterior. O cofre guarda outra palavra.',
    },
  ],
  hint: {
    cost: 60,
    text: 'A chave é uma palavra que você já descobriu nesta missão. Cada letra dela indica um deslocamento: A = 0, B = 1, C = 2…',
  },
  success: {
    title: 'Cofre aberto',
    lesson:
      'Você decifrou uma Cifra de Vigenère, conhecida por séculos como "a cifra indecifrável".',
  },
  Stage: VaultStage,
};

export default vault;
