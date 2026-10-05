// The three documents found in the investigation room. Only the mission record
// leads to the combination; the other two are there to be ruled out, so none
// of their numbers or words may form another valid answer (see the tests).

// Eight 8-bit groups: ASCII for a Welsh word, to be decoded by the player
const MISSION_SIGNAL = [
  '01000010',
  '01001100',
  '01010111',
  '01011001',
  '01000100',
  '01000100',
  '01011001',
  '01001110',
];

export const DOCUMENTS = [
  {
    id: 'registros',
    code: 'DOC-01',
    label: 'Registro de operações',
    title: 'ARQUIVO CONFIDENCIAL — REGISTRO DE OPERAÇÕES',
    paragraphs: [
      'Durante a investigação, diversos registros antigos foram recuperados de um arquivo parcialmente danificado.',
      'Alguns documentos continham informações sobre movimentações, horários, códigos de acesso e registros de operações.',
      'Não foi possível determinar quais desses registros estavam relacionados diretamente ao caso investigado.',
    ],
    listTitle: 'REGISTROS RECUPERADOS',
    list: [
      '14/03/1987 — 07:42:16 — ID 0419',
      '07/11/1989 — 16:32:08 — REF 7314',
      '21/06/1991 — 09:17:52 — ID 2901',
      '05/02/1984 — 11:48:03 — REF 4827',
      '18/06/1996 — 12:04:37 — ID 6103',
      '27/09/1982 — 18:21:44 — REF 1938',
      '03/12/1990 — 06:53:29 — ID 8241',
    ],
    footer: ['STATUS DOS REGISTROS: ARQUIVADOS', 'NÍVEL DE ACESSO: RESTRITO'],
  },
  {
    id: 'linguistico',
    code: 'DOC-02',
    label: 'Registro linguístico',
    title: 'DOCUMENTO CONFIDENCIAL — REGISTRO LINGUÍSTICO',
    paragraphs: [
      'Durante a análise dos arquivos recuperados, os investigadores encontraram diversas anotações escritas em um idioma desconhecido.',
      'Após uma análise inicial, foi identificado que parte dos registros estava escrita em galês, uma língua tradicionalmente falada no País de Gales.',
      'Algumas palavras foram preservadas no documento original:',
    ],
    words: ['CARTREF', 'NOS', 'DŴR', 'CARIAD'],
    closing: [
      'Os investigadores registraram que a presença do idioma pode estar relacionada à origem de alguns dos documentos encontrados durante a operação.',
      'Nenhuma tradução completa foi recuperada.',
    ],
    footer: ['IDIOMA IDENTIFICADO: GALÊS', 'STATUS: EM INVESTIGAÇÃO'],
  },
  {
    id: 'missao',
    code: 'DOC-03',
    label: 'Registro de missão',
    title: 'DOCUMENTO CONFIDENCIAL — REGISTRO DE MISSÃO',
    banner: 'REGISTRO PARCIALMENTE RECUPERADO',
    paragraphs: [
      'Um dos arquivos encontrados durante a investigação contém referências a uma missão que levou seres humanos para além da Terra.',
      'O documento original apresenta diversos trechos corrompidos, mas algumas informações ainda puderam ser recuperadas.',
    ],
    facts: [
      ['MISSÃO', '11'],
      ['DESTINO', 'LUA'],
      ['COMUNICAÇÃO', 'RECUPERADA'],
      ['STATUS', 'HISTÓRICO'],
    ],
    signalIntro:
      'Entre os fragmentos recuperados havia uma sequência que não parecia pertencer ao formato original do documento:',
    signal: MISSION_SIGNAL,
    signalOutro: 'O significado dessa sequência permanece desconhecido.',
    quoteIntro: 'Um último fragmento da transmissão também foi recuperado:',
    quote: '“UM PEQUENO PASSO...”',
    footer: ['ARQUIVO ENCERRADO'],
  },
];
