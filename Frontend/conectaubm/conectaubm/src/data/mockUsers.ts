import type { ID, User } from '@/types';
import { ago } from '@/utils/date';
import { mockMedia } from './mockMedia';

/**
 * Estudantes ilustrativos da tela de entrada (constelação e avatares), mostrados antes de existir
 * sessão. Não são contas: os perfis reais vêm da API depois do login.
 */

type Seed = Omit<User, 'avatarUrl' | 'coverUrl' | 'joinedAt' | 'messagePolicy' | 'email'> & {
  coverUrl?: string;
  monthsAgo: number;
  messagePolicy?: User['messagePolicy'];
};

const seeds: Seed[] = [
  {
    id: 'thiago', name: 'Thiago Bastos', course: 'Engenharia de Software', period: 5, avatarSeed: 'ubm19', online: true, connectionCount: 142, monthsAgo: 14,
    bio: 'Back-end em formação. Organizo o grupo de estudos de algoritmos toda quarta, na sala 204.',
    interests: ['Programação', 'Hackathons', 'Games', 'Xadrez'],
    friends: ['nicole', 'enzo', 'jonas', 'caio', 'murilo', 'felipe'],
  },
  {
    id: 'marina', name: 'Marina Albuquerque', course: 'Direito', period: 6, avatarSeed: 'Sofia', online: true, connectionCount: 203, monthsAgo: 20,
    bio: 'Estagiária no Núcleo de Prática Jurídica. Debato qualquer assunto, de preferência com café.',
    interests: ['Leitura', 'Teatro', 'Café', 'Voluntariado'],
    friends: ['clara', 'livia', 'murilo', 'otavio', 'aline', 'samuel'],
    coverUrl: mockMedia.campusSunset.url,
  },
  {
    id: 'bia', name: 'Beatriz Nakamura', course: 'Arquitetura e Urbanismo', period: 7, avatarSeed: 'ubm30', online: false, connectionCount: 176, monthsAgo: 26,
    bio: 'Maquetes, croquis e noites viradas no ateliê. Fotografo a cidade no caminho para a aula.',
    interests: ['Fotografia', 'Design', 'Viagens', 'Café'],
    friends: ['yasmin', 'pedro', 'nicole', 'murilo', 'manu'],
    coverUrl: mockMedia.blueprint.url,
  },
  {
    id: 'rafael', name: 'Rafael Tavares', course: 'Educação Física', period: 4, avatarSeed: 'Vitor', online: true, connectionCount: 318, monthsAgo: 16,
    bio: 'Capitão do futsal da Atlética. Treino funcional aberto toda sexta, 18h, na quadra.',
    interests: ['Futsal', 'Academia', 'Corrida', 'Podcasts'],
    friends: ['duda', 'camila', 'caio', 'pedro', 'sofia', 'igor'],
    coverUrl: mockMedia.court.url,
  },
  {
    id: 'livia', name: "Lívia Sant'Anna", course: 'Psicologia', period: 8, avatarSeed: 'Helena', online: false, connectionCount: 187, monthsAgo: 30,
    bio: 'Extensão em escuta acolhedora. Por aqui se fala de saúde mental sem tabu.',
    interests: ['Saúde mental', 'Leitura', 'Voluntariado', 'Séries'],
    friends: ['samuel', 'marina', 'helena', 'aline', 'camila'],
  },
  {
    id: 'caio', name: 'Caio Meirelles', course: 'Administração', period: 3, avatarSeed: 'ubm15', online: false, connectionCount: 96, monthsAgo: 9,
    bio: 'Empresa Júnior, planilhas e muita vontade de abrir o próprio negócio.',
    interests: ['Empreendedorismo', 'Finanças', 'Marketing', 'Futsal'],
    friends: ['otavio', 'vitor', 'rafael', 'thiago', 'breno'],
  },
  {
    id: 'helena', name: 'Helena Duarte', course: 'Enfermagem', period: 5, avatarSeed: 'Tainá', online: true, connectionCount: 154, monthsAgo: 18,
    bio: 'Monitora de Anatomia. Tem plantão de dúvidas antes de toda prova, é só chamar.',
    interests: ['Pesquisa científica', 'Voluntariado', 'Corrida', 'Café'],
    friends: ['leticia', 'taina', 'camila', 'livia', 'manu', 'isadora'],
  },
  {
    id: 'yasmin', name: 'Yasmin Rocha', course: 'Publicidade e Propaganda', period: 4, avatarSeed: 'Yasmin', online: true, connectionCount: 264, monthsAgo: 15,
    bio: 'Diretora de arte da agência experimental. Faço cartaz de festa da Atlética por diversão.',
    interests: ['Design', 'Marketing', 'Fotografia', 'Música'],
    friends: ['bia', 'felipe', 'murilo', 'duda', 'otavio'],
  },
  {
    id: 'nicole', name: 'Nicole Azevedo', course: 'Engenharia de Software', period: 6, avatarSeed: 'Nicole', online: false, connectionCount: 211, monthsAgo: 22,
    bio: 'Front-end, acessibilidade e UX. Mentoro calouras que querem entrar em tecnologia.',
    interests: ['Programação', 'Design', 'Hackathons', 'Idiomas'],
    friends: ['thiago', 'enzo', 'bia', 'jonas', 'yasmin'],
  },
  {
    id: 'igor', name: 'Igor Valença', course: 'Engenharia Mecânica', period: 9, avatarSeed: 'ubm33', online: false, connectionCount: 133, monthsAgo: 34,
    bio: 'Equipe Baja UBM. Graxa na mão, TCC na cabeça e formatura em vista.',
    interests: ['Games', 'Academia', 'Viagens', 'Música'],
    friends: ['jonas', 'pedro', 'breno', 'rafael', 'thiago'],
  },
  {
    id: 'pedro', name: 'Pedro Lacerda', course: 'Engenharia Civil', period: 6, avatarSeed: 'Pedro', online: true, connectionCount: 121, monthsAgo: 21,
    bio: 'Estágio em obra de manhã, concreto armado à noite. Carona saindo de Volta Redonda.',
    interests: ['Viagens', 'Futsal', 'Finanças', 'Podcasts'],
    friends: ['bia', 'igor', 'rafael', 'breno', 'thiago'],
  },
  {
    id: 'sofia', name: 'Sofia Guimarães', course: 'Nutrição', period: 2, avatarSeed: 'ubm39', online: true, connectionCount: 58, monthsAgo: 5,
    bio: 'Caloura feliz. Compartilho receitas baratas para quem mora em república.',
    interests: ['Culinária', 'Academia', 'Dança', 'Séries'],
    friends: ['manu', 'rafael', 'helena', 'duda'],
  },
  {
    id: 'leticia', name: 'Letícia Pacheco', course: 'Biomedicina', period: 6, avatarSeed: 'ubm4', online: false, connectionCount: 109, monthsAgo: 23,
    bio: 'Iniciação científica em microbiologia. O laboratório é minha segunda casa.',
    interests: ['Pesquisa científica', 'Leitura', 'Xadrez', 'Pets'],
    friends: ['helena', 'taina', 'isadora', 'thiago'],
  },
  {
    id: 'murilo', name: 'Murilo Antunes', course: 'Jornalismo', period: 5, avatarSeed: 'ubm23', online: true, connectionCount: 289, monthsAgo: 19,
    bio: 'Editor do jornal do campus. Se aconteceu na UBM, eu estou apurando.',
    interests: ['Podcasts', 'Cinema', 'Leitura', 'Fotografia'],
    friends: ['felipe', 'marina', 'yasmin', 'bia', 'thiago', 'livia'],
  },
  {
    id: 'isadora', name: 'Isadora Freitas', course: 'Medicina Veterinária', period: 3, avatarSeed: 'ubm1', online: true, connectionCount: 147, monthsAgo: 10,
    bio: 'Projeto Patas UBM, de adoção responsável. Sim, pode me mandar foto do seu pet.',
    interests: ['Pets', 'Voluntariado', 'Viagens', 'Sustentabilidade'],
    friends: ['leticia', 'helena', 'marina', 'sofia'],
  },
  {
    id: 'vitor', name: 'Vitor Hugo Paiva', course: 'Ciências Contábeis', period: 7, avatarSeed: 'ubm8', online: false, connectionCount: 88, monthsAgo: 27,
    bio: 'Monitor de Contabilidade de Custos. Declaração de imposto de renda não morde.',
    interests: ['Finanças', 'Xadrez', 'Empreendedorismo', 'Séries'],
    friends: ['caio', 'otavio', 'breno'],
    messagePolicy: 'connections',
  },
  {
    id: 'camila', name: 'Camila Ribeiro', course: 'Fisioterapia', period: 4, avatarSeed: 'ubm6', online: true, connectionCount: 165, monthsAgo: 13,
    bio: 'Liga de fisioterapia esportiva. Atendo a galera da Atlética nos dias de jogo.',
    interests: ['Vôlei', 'Academia', 'Dança', 'Saúde mental'],
    friends: ['rafael', 'duda', 'helena', 'livia'],
  },
  {
    id: 'enzo', name: 'Enzo Carvalho', course: 'Engenharia de Software', period: 2, avatarSeed: 'ubm2', online: true, connectionCount: 41, monthsAgo: 4,
    bio: 'Calouro. Meu primeiro hackathon é em novembro e ainda estou procurando time.',
    interests: ['Programação', 'Games', 'Hackathons', 'Música'],
    friends: ['thiago', 'nicole'],
  },
  {
    id: 'aline', name: 'Aline Moraes', course: 'Pedagogia', period: 6, avatarSeed: 'Aline', online: false, connectionCount: 117, monthsAgo: 24,
    bio: 'Brinquedoteca, contação de histórias e estágio na educação infantil.',
    interests: ['Leitura', 'Teatro', 'Voluntariado', 'Idiomas'],
    friends: ['marina', 'livia', 'samuel', 'clara'],
  },
  {
    id: 'jonas', name: 'Jonas Figueiredo', course: 'Engenharia Elétrica', period: 8, avatarSeed: 'ubm35', online: false, connectionCount: 102, monthsAgo: 31,
    bio: 'Automação residencial de dia, violão nas horas vagas.',
    interests: ['Música', 'Programação', 'Sustentabilidade', 'Xadrez'],
    friends: ['igor', 'thiago', 'nicole', 'pedro'],
  },
  {
    id: 'taina', name: 'Tainá Correia', course: 'Farmácia', period: 5, avatarSeed: 'ubm28', online: true, connectionCount: 93, monthsAgo: 17,
    bio: 'Farmácia Escola às terças. Se precisar, eu traduzo a bula.',
    interests: ['Pesquisa científica', 'Culinária', 'Corrida', 'Séries'],
    friends: ['helena', 'leticia', 'manu'],
  },
  {
    id: 'breno', name: 'Breno Siqueira', course: 'Engenharia de Produção', period: 6, avatarSeed: 'ubm17', online: false, connectionCount: 126, monthsAgo: 22,
    bio: 'Lean, kaizen e a fila da cantina cronometrada para um trabalho de Tempos e Métodos.',
    interests: ['Empreendedorismo', 'Finanças', 'Corrida', 'Podcasts'],
    friends: ['caio', 'igor', 'pedro', 'vitor', 'otavio'],
  },
  {
    id: 'clara', name: 'Clara Mendonça', course: 'Direito', period: 2, avatarSeed: 'ubm26', online: true, connectionCount: 64, monthsAgo: 5,
    bio: 'Caloura de Direito, time de debates e ouvinte fiel de podcast de true crime.',
    interests: ['Leitura', 'Podcasts', 'Teatro', 'Idiomas'],
    friends: ['marina', 'aline', 'samuel'],
  },
  {
    id: 'otavio', name: 'Otávio Brandão', course: 'Administração', period: 8, avatarSeed: 'ubm36', online: false, connectionCount: 342, monthsAgo: 33,
    bio: 'Presidente da Empresa Júnior. Abrimos processo seletivo todo começo de semestre.',
    interests: ['Empreendedorismo', 'Marketing', 'Finanças', 'Viagens'],
    friends: ['caio', 'vitor', 'breno', 'marina', 'yasmin'],
  },
  {
    id: 'samuel', name: 'Samuel Teixeira', course: 'Psicologia', period: 3, avatarSeed: 'ubm20', online: false, connectionCount: 79, monthsAgo: 9,
    bio: 'Grupo de leitura de Psicologia Social às quintas. Chega mais, não precisa ser do curso.',
    interests: ['Leitura', 'Cinema', 'Saúde mental', 'Música'],
    friends: ['livia', 'marina', 'aline', 'clara'],
  },
  {
    id: 'duda', name: 'Duda Lopes', course: 'Educação Física', period: null, avatarSeed: 'ubm10', online: true, connectionCount: 297, monthsAgo: 25,
    bio: 'Atlética, vôlei e bateria. Se tem jogo, eu estou na arquibancada.',
    interests: ['Vôlei', 'Dança', 'Música', 'Academia'],
    friends: ['rafael', 'camila', 'yasmin', 'sofia'],
  },
  {
    id: 'felipe', name: 'Felipe Arantes', course: 'Jornalismo', period: null, avatarSeed: 'Felipe', online: false, connectionCount: 231, monthsAgo: 28,
    bio: 'Apresento o podcast Intervalo, gravado toda semana no estúdio do campus.',
    interests: ['Podcasts', 'Cinema', 'Música', 'Games'],
    friends: ['murilo', 'yasmin', 'thiago'],
  },
  {
    id: 'manu', name: 'Manuela Prado', course: 'Nutrição', period: 7, avatarSeed: 'ubm24', online: false, connectionCount: 138, monthsAgo: 29,
    bio: 'Estágio em nutrição esportiva e corrida de rua aos domingos.',
    interests: ['Corrida', 'Culinária', 'Pesquisa científica', 'Viagens'],
    friends: ['sofia', 'helena', 'taina', 'bia'],
  },
];

export function buildMockUsers(): Record<ID, User> {
  const users: Record<ID, User> = {};
  for (const { monthsAgo, coverUrl, messagePolicy, ...seed } of seeds) {
    users[seed.id] = {
      ...seed,
      avatarUrl: null,
      coverUrl: coverUrl ?? null,
      joinedAt: ago({ d: monthsAgo * 30 }),
      messagePolicy: messagePolicy ?? 'everyone',
    };
  }
  return users;
}
