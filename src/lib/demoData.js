import { uid } from './format';

// Coherent demo data for "Summit Conecta 2026".
// Financial targets: faturamento previsto ~74.800 / recebido ~46.350 / despesas 43.200 / pago 31.700.

const today = '2026-09-28';

const expenseCategories = [
  'Espaço', 'Alimentação', 'Audiovisual', 'Marketing', 'Equipe', 'Impressos', 'Brindes', 'Segurança', 'Transporte', 'Outros'
];
const revenueCategories = ['Ingressos', 'Patrocínios', 'Stands', 'Inscrições', 'Produtos', 'Doações', 'Outros'];

const suppliers = [
  { id: uid(), name: 'Centro Empresarial', service: 'Espaço', contact: 'ana@centroempresarial.com', contracted: 11000, paid: 11000, entry: 11000, nextDue: null, dueDate: null, paymentData: 'PIX • CNPJ 12.345.678/0001-90', notes: 'Incluso monta/desmonta.', status: 'pago', expenseCategory: 'Espaço', expenseType: 'fixed' },
  { id: uid(), name: 'Buffet Sabor', service: 'Alimentação', contact: 'buffet@sabor.com', contracted: 13500, paid: 6000, entry: 6000, nextDue: '2026-11-12', dueDate: '2026-11-12', paymentData: 'Transferência • Banco do Brasil', notes: 'R$ 75 por pessoa.', status: 'pendente', expenseCategory: 'Alimentação', expenseType: 'perParticipant', unitValue: 75 },
  { id: uid(), name: 'Audio Pro', service: 'Audiovisual', contact: 'contato@audiopro.com', contracted: 7500, paid: 4000, entry: 4000, nextDue: '2026-11-05', dueDate: '2026-11-05', paymentData: 'PIX', notes: 'Som + iluminação + 2 técnicos.', status: 'pendente', expenseCategory: 'Audiovisual', expenseType: 'fixed' },
  { id: uid(), name: 'MKT Digital', service: 'Marketing', contact: 'ops@mktdigital.com', contracted: 3500, paid: 3500, entry: 3500, nextDue: null, dueDate: null, paymentData: 'Cartão', notes: 'Mídia paga + landing.', status: 'pago', expenseCategory: 'Marketing', expenseType: 'fixed' },
  { id: uid(), name: 'Equipe Eventos', service: 'Equipe', contact: 'rh@equipeeventos.com', contracted: 3200, paid: 3200, entry: 3200, nextDue: null, dueDate: null, paymentData: 'PIX', notes: '8 recepcionistas.', status: 'pago', expenseCategory: 'Equipe', expenseType: 'fixed' },
  { id: uid(), name: 'Gráfica Rápida', service: 'Impressos', contact: 'vendas@graficarapida.com', contracted: 1500, paid: 1500, entry: 1500, nextDue: null, dueDate: null, paymentData: 'Boleto', notes: 'Crachás, programas, sinalização.', status: 'pago', expenseCategory: 'Impressos', expenseType: 'fixed' },
  { id: uid(), name: 'Brindes & Cia', service: 'Brindes', contact: 'contato@brindescia.com', contracted: 1000, paid: 1000, entry: 1000, nextDue: null, dueDate: null, paymentData: 'PIX', notes: 'Canetas e blocos.', status: 'pago', expenseCategory: 'Brindes', expenseType: 'fixed' },
  { id: uid(), name: 'Segurança Plus', service: 'Segurança', contact: 'operacao@segurancaplus.com', contracted: 1500, paid: 1500, entry: 1500, nextDue: null, dueDate: null, paymentData: 'Transferência', notes: '4 seguranças.', status: 'pago', expenseCategory: 'Segurança', expenseType: 'fixed' }
];

// expenses derived from suppliers + a couple of extras
const expenses = [
  { id: uid(), description: 'Locação do espaço', category: 'Espaço', supplierId: suppliers[0].id, type: 'fixed', qty: 1, unitValue: 11000, dueDate: '2026-08-10', status: 'pago', note: '' },
  { id: uid(), description: 'Buffet — R$ 75/pessoa', category: 'Alimentação', supplierId: suppliers[1].id, type: 'perParticipant', qty: 1, unitValue: 75, dueDate: '2026-11-12', status: 'parcial', note: 'Custo por participante.' },
  { id: uid(), description: 'Audiovisual completo', category: 'Audiovisual', supplierId: suppliers[2].id, type: 'fixed', qty: 1, unitValue: 7500, dueDate: '2026-11-05', status: 'parcial', note: '' },
  { id: uid(), description: 'Campanha de marketing', category: 'Marketing', supplierId: suppliers[3].id, type: 'fixed', qty: 1, unitValue: 3500, dueDate: '2026-09-20', status: 'pago', note: '' },
  { id: uid(), description: 'Recepcionistas', category: 'Equipe', supplierId: suppliers[4].id, type: 'fixed', qty: 1, unitValue: 3200, dueDate: '2026-09-25', status: 'pago', note: '' },
  { id: uid(), description: 'Material gráfico', category: 'Impressos', supplierId: suppliers[5].id, type: 'fixed', qty: 1, unitValue: 1500, dueDate: '2026-10-01', status: 'pago', note: '' },
  { id: uid(), description: 'Brindes', category: 'Brindes', supplierId: suppliers[6].id, type: 'fixed', qty: 1, unitValue: 1000, dueDate: '2026-10-10', status: 'pago', note: '' },
  { id: uid(), description: 'Segurança privada', category: 'Segurança', supplierId: suppliers[7].id, type: 'fixed', qty: 1, unitValue: 1500, dueDate: '2026-10-15', status: 'pago', note: '' }
];

const sponsorPlans = [
  { id: uid(), name: 'Master', price: 15000, available: 1, sold: 1, complimentary: 6, benefits: 'Logo grande, fala de abertura, stand premium.', notes: 'Cota principal.' },
  { id: uid(), name: 'Ouro', price: 8000, available: 2, sold: 1, complimentary: 4, benefits: 'Logo médio, stand, 2 convites.', notes: '' },
  { id: uid(), name: 'Apoio', price: 3000, available: 4, sold: 3, complimentary: 2, benefits: 'Logo pequeno, 1 convite.', notes: '' }
];

const sponsors = [
  { id: uid(), company: 'Nuvex Tecnologia', contact: 'patrocinio@nuvex.com', plan: 'Master', negotiated: 15000, received: 15000, dueDate: '2026-09-01', guests: 6, status: 'quitado', deliverables: 'Logo, fala, stand premium.' },
  { id: uid(), company: 'Banco Meridiano', contact: 'marketing@meridiano.com', plan: 'Ouro', negotiated: 8000, received: 8000, dueDate: '2026-09-10', guests: 4, status: 'quitado', deliverables: 'Logo, stand.' },
  { id: uid(), company: 'Logística Andrade', contact: 'eventos@andrade.com', plan: 'Apoio', negotiated: 3000, received: 3000, dueDate: '2026-09-15', guests: 2, status: 'quitado', deliverables: 'Logo pequeno.' },
  { id: uid(), company: 'Café Montanha', contact: 'comercial@cafemontanha.com', plan: 'Apoio', negotiated: 3000, received: 0, dueDate: '2026-10-20', guests: 2, status: 'pendente', deliverables: 'Logo, degustação.' },
  { id: uid(), company: 'EducaMais', contact: 'parcerias@educamais.com', plan: 'Apoio', negotiated: 3000, received: 0, dueDate: '2026-11-01', guests: 2, status: 'pendente', deliverables: 'Logo.' }
];

const tickets = [
  {
    id: uid(), name: 'Ingresso Geral', description: 'Acesso a todas as palestras e coffee breaks.',
    lots: [
      { id: uid(), name: 'Pré-venda', price: 199, limitDate: '2026-09-10', sold: 45, expectedSales: 50, capacity: 60 },
      { id: uid(), name: '1º lote', price: 249, limitDate: '2026-09-30', sold: 20, expectedSales: 60, capacity: 80 },
      { id: uid(), name: '2º lote', price: 299, limitDate: '2026-11-10', sold: 0, expectedSales: 30, capacity: 50 }
    ]
  },
  {
    id: uid(), name: 'VIP', description: 'Acesso VIP, fila prioritária e kit exclusivo.',
    lots: [
      { id: uid(), name: 'Único', price: 499, limitDate: '2026-11-15', sold: 8, expectedSales: 8, capacity: 12 }
    ]
  },
  {
    id: uid(), name: 'Associado', description: 'Valor exclusivo para associados.',
    lots: [
      { id: uid(), name: 'Único', price: 149, limitDate: '2026-11-15', sold: 0, expectedSales: 0, capacity: 40 }
    ]
  }
];

const revenues = [
  { id: uid(), description: 'Stands extras', type: 'Stands', expected: 2500, received: 2500, expectedDate: '2026-10-01', receivedDate: '2026-09-12', category: 'Stands', status: 'recebido' },
  { id: uid(), description: 'Stand institucional', type: 'Stands', expected: 2500, received: 0, expectedDate: '2026-11-01', receivedDate: null, category: 'Stands', status: 'previsto' }
];

const participants = [
  { id: uid(), name: 'Marina Costa', email: 'marina@nuvex.com', phone: '(11) 98888-1010', company: 'Nuvex', type: 'Patrocinador', status: 'Confirmado' },
  { id: uid(), name: 'Carlos Mendes', email: 'carlos@meridiano.com', phone: '(11) 97777-2020', company: 'Banco Meridiano', type: 'Patrocinador', status: 'Confirmado' },
  { id: uid(), name: 'Júlia Ferreira', email: 'julia@andrade.com', phone: '(21) 96666-3030', company: 'Andrade', type: 'Palestrante', status: 'Confirmado' },
  { id: uid(), name: 'Rafael Lima', email: 'rafael@educamais.com', phone: '(31) 95555-4040', company: 'EducaMais', type: 'Palestrante', status: 'Pendente' },
  { id: uid(), name: 'Beatriz Souza', email: 'bia@cafemontanha.com', phone: '(11) 94444-5050', company: 'Café Montanha', type: 'Expositor', status: 'Confirmado' },
  { id: uid(), name: 'Pedro Alves', email: 'pedro.alves@email.com', phone: '(11) 93333-6060', company: 'Alves Consultoria', type: 'Participante', status: 'Confirmado' },
  { id: uid(), name: 'Camila Rocha', email: 'camila.rocha@email.com', phone: '(11) 92222-7070', company: 'Rocha Advogados', type: 'Participante', status: 'Confirmado' },
  { id: uid(), name: 'Diego Martins', email: 'diego.martins@email.com', phone: '(41) 91111-8080', company: 'Martins Engenharia', type: 'Participante', status: 'Pendente' },
  { id: uid(), name: 'Larissa Pinto', email: 'larissa.pinto@email.com', phone: '(11) 90000-9090', company: 'Pinto Design', type: 'VIP', status: 'Confirmado' },
  { id: uid(), name: 'Henrique Dias', email: 'henrique.dias@email.com', phone: '(51) 98888-1212', company: 'Dias & Cia', type: 'Participante', status: 'Confirmado' },
  { id: uid(), name: 'Fernanda Melo', email: 'fernanda.melo@email.com', phone: '(11) 97777-2323', company: 'Melo Contábil', type: 'Equipe', status: 'Confirmado' },
  { id: uid(), name: 'Otávio Ramos', email: 'otavio.ramos@email.com', phone: '(62) 96666-3434', company: 'Ramos Logística', type: 'Participante', status: 'Cancelado' },
  { id: uid(), name: 'Sandra Vieira', email: 'sandra.vieira@email.com', phone: '(11) 95555-4545', company: 'Vieira Saúde', type: 'Convidado', status: 'Confirmado' },
  { id: uid(), name: 'Marcelo Tavares', email: 'marcelo.tavares@email.com', phone: '(71) 94444-5656', company: 'Tavares Imóveis', type: 'Participante', status: 'Pendente' }
];

const tasks = [
  { id: uid(), name: 'Confirmar quantidade final com buffet', owner: 'Marina', date: '2026-09-28', category: 'Alimentação', priority: 'Alta', status: 'A fazer' },
  { id: uid(), name: 'Pagar entrada do fornecedor de audiovisual', owner: 'Carlos', date: '2026-09-29', category: 'Financeiro', priority: 'Alta', status: 'A fazer' },
  { id: uid(), name: 'Fechar programação', owner: 'Marina', date: '2026-10-30', category: 'Programação', priority: 'Normal', status: 'A fazer' },
  { id: uid(), name: 'Enviar informações aos palestrantes', owner: 'Júlia', date: '2026-11-02', category: 'Programação', priority: 'Normal', status: 'A fazer' },
  { id: uid(), name: 'Contratar serviço de segurança', owner: '', date: '2026-10-05', category: 'Operação', priority: 'Alta', status: 'A fazer' },
  { id: uid(), name: 'Definir cardápio final', owner: '', date: '2026-09-25', category: 'Alimentação', priority: 'Normal', status: 'A fazer' },
  { id: uid(), name: 'Confirmar lista de cortesias', owner: '', date: '2026-10-12', category: 'Participantes', priority: 'Normal', status: 'A fazer' },
  { id: uid(), name: 'Produzir crachás', owner: '', date: '2026-10-15', category: 'Operação', priority: 'Normal', status: 'A fazer' },
  { id: uid(), name: 'Briefing de equipe', owner: '', date: '2026-11-10', category: 'Equipe', priority: 'Normal', status: 'A fazer' },
  { id: uid(), name: 'Conferir sonorização no local', owner: '', date: '2026-11-15', category: 'Audiovisual', priority: 'Normal', status: 'A fazer' },
  { id: uid(), name: 'Fechar convites VIP', owner: '', date: '2026-09-20', category: 'Participantes', priority: 'Alta', status: 'A fazer' },
  { id: uid(), name: 'Enviar press release', owner: 'Júlia', date: '2026-09-15', category: 'Marketing', priority: 'Normal', status: 'A fazer' },
  { id: uid(), name: 'Abrir inscrições', owner: 'Marina', date: '2026-08-20', category: 'Marketing', priority: 'Normal', status: 'Concluído' },
  { id: uid(), name: 'Fechar contrato do espaço', owner: 'Carlos', date: '2026-08-10', category: 'Espaço', priority: 'Normal', status: 'Concluído' },
  { id: uid(), name: 'Definir identidade visual', owner: 'Marina', date: '2026-08-15', category: 'Marketing', priority: 'Normal', status: 'Concluído' }
];

const schedule = [
  { id: uid(), start: '09:00', duration: 30, title: 'Credenciamento', type: 'Credenciamento', speaker: '', room: 'Recepção' },
  { id: uid(), start: '09:30', duration: 20, title: 'Abertura oficial', type: 'Abertura', speaker: 'Marina Costa', room: 'Auditório' },
  { id: uid(), start: '09:50', duration: 45, title: 'O futuro da gestão de eventos', type: 'Palestra', speaker: 'Júlia Ferreira', room: 'Auditório' },
  { id: uid(), start: '10:35', duration: 25, title: 'Coffee break', type: 'Intervalo', speaker: '', room: 'Mezanino' },
  { id: uid(), start: '11:00', duration: 40, title: 'Métricas que importam', type: 'Palestra', speaker: 'Rafael Lima', room: 'Auditório' },
  { id: uid(), start: '11:40', duration: 50, title: 'Painel: patrocínio com retorno', type: 'Painel', speaker: 'Carlos Mendes', room: 'Auditório' },
  { id: uid(), start: '12:30', duration: 120, title: 'Almoço', type: 'Almoço', speaker: '', room: 'Restaurante' },
  { id: uid(), start: '14:30', duration: 60, title: 'Workshop: planejamento financeiro', type: 'Workshop', speaker: 'Fernanda Melo', room: 'Sala 2' },
  { id: uid(), start: '15:30', duration: 20, title: 'Coffee break', type: 'Intervalo', speaker: '', room: 'Mezanino' },
  { id: uid(), start: '15:50', duration: 55, title: 'Painel: networking de resultados', type: 'Painel', speaker: 'Henrique Dias', room: 'Auditório' },
  { id: uid(), start: '16:45', duration: 75, title: 'Rodadas de negócio', type: 'Networking', speaker: '', room: 'Salão principal' },
  { id: uid(), start: '18:00', duration: 25, title: 'Encerramento', type: 'Encerramento', speaker: 'Marina Costa', room: 'Auditório' }
];

const networking = {
  enabled: true,
  tables: 14,
  rounds: 11,
  capacityPerTable: 8,
  fixedHosts: 14,
  rotatingHosts: 0,
  rotatingParticipants: 98,
  desiredEnd: '18:00'
};

export const demoEvent = {
  id: 'summit-conecta-2026',
  name: 'Summit Conecta 2026',
  date: '2026-11-18',
  city: 'São Paulo, SP',
  location: 'Centro Empresarial',
  expectedAudience: 180,
  capacity: 220,
  confirmed: 138,
  pending: 42,
  complimentary: 20,
  staff: 15,
  goalRevenue: 90000,
  status: 'planejamento',
  desiredEndTime: '18:00',
  cateringBudget: 12000,
  modules: { tickets: true, sponsors: true, suppliers: true, schedule: true, networking: true },
  expenseCategories,
  revenueCategories,
  tickets, sponsors, sponsorPlans, suppliers, expenses, revenues, participants, tasks, schedule, networking
};

export const demoEvents = [
  {
    id: 'summit-conecta-2026',
    name: 'Summit Conecta 2026',
    date: '2026-11-18',
    city: 'São Paulo, SP',
    location: 'Centro Empresarial',
    expectedAudience: 180,
    status: 'planejamento',
    color: 'jade'
  },
  {
    id: 'workshop-vendas',
    name: 'Workshop Vendas B2B',
    date: '2026-10-08',
    city: 'Campinas, SP',
    location: 'Hotel Vitória',
    expectedAudience: 60,
    status: 'planejamento',
    color: 'amber'
  },
  {
    id: 'congresso-saude',
    name: 'Congresso Saúde Integrativa',
    date: '2026-09-12',
    city: 'Curitiba, PR',
    location: 'Expo Center',
    expectedAudience: 320,
    status: 'finalizado',
    color: 'slate'
  }
];

export const emptyEventTemplate = (data) => ({
  id: uid(),
  name: data.name,
  date: data.date,
  city: data.city || '',
  location: data.location || '',
  expectedAudience: data.expectedAudience ?? 0,
  capacity: data.capacity ?? 0,
  confirmed: 0,
  pending: 0,
  complimentary: 0,
  staff: 0,
  goalRevenue: 0,
  status: 'planejamento',
  desiredEndTime: '18:00',
  cateringBudget: 0,
  modules: data.modules || { tickets: false, sponsors: false, suppliers: false, schedule: false, networking: false },
  expenseCategories: [...expenseCategories],
  revenueCategories: [...revenueCategories],
  tickets: [], sponsors: [], sponsorPlans: [], suppliers: [], expenses: [], revenues: [], participants: [], tasks: [], staffMembers: [], schedule: [],
  networking: { enabled: false, tables: 0, rounds: 0, capacityPerTable: 8, fixedHosts: 0, rotatingHosts: 0, rotatingParticipants: 0, desiredEnd: '18:00' }
});
