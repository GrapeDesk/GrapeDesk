export interface Article {
  id?: number; slug: string; title: string; summary: string; category: string; icon: string;
  steps: string[]; keywords: string; important?: boolean;
}
export interface KbCategory { name: string; icon: string; bg: string; fg: string; }

export const KB_CATEGORIES: KbCategory[] = [
  { name: 'TI', icon: 'monitor', bg: '#e3efff', fg: '#2b6cd9' },
  { name: 'RH', icon: 'users', bg: '#e4f7e8', fg: '#1f9d55' },
  { name: 'Financeiro', icon: 'dollar', bg: '#ffeccc', fg: '#e08a00' },
  { name: 'Infraestrutura', icon: 'server', bg: '#ece4ff', fg: '#6b46d6' },
  { name: 'Sistemas', icon: 'monitor', bg: '#ffe3e6', fg: '#e0364d' },
  { name: 'Equipamentos', icon: 'printer', bg: '#e0f0ff', fg: '#2b7bd9' },
];

export const KB_ARTICLES: Article[] = [
  { slug: 'como-definir-sua-senha', title: 'Como definir sua senha', summary: 'Aprenda a criar ou redefinir sua senha de acesso.', category: 'TI', icon: 'lock', important: true, keywords: 'senha acesso login redefinir',
    steps: ['Use uma senha com pelo menos 8 caracteres, misturando letras, números e símbolos.', 'Evite datas de aniversário, nomes e sequências como 123456.', 'Para redefinir, procure o Departamento de TI ou abra um chamado na categoria "Acesso / Senha".', 'Após receber a senha temporária, entre no sistema e troque-a imediatamente.'] },
  { slug: 'integracoes-disponiveis', title: 'Integrações disponíveis', summary: 'Consulte as integrações do sistema e saiba como utilizá-las.', category: 'Sistemas', icon: 'plug', keywords: 'integrações api whatsapp',
    steps: ['Acesse Configurações > Integrações para ver as integrações disponíveis.', 'Atualmente o Grape Desk prevê integração com o chatbot de WhatsApp para triagem de chamados.', 'Cada integração exige autorização do Departamento de TI antes de ser ativada.'] },
  { slug: 'relatorios-primeiros-passos', title: 'Relatórios: primeiros passos', summary: 'Aprenda a gerar e personalizar seus relatórios.', category: 'Sistemas', icon: 'file-text', keywords: 'relatórios indicadores desempenho',
    steps: ['Abra o menu Relatórios na barra lateral.', 'Veja os indicadores de chamados por mês, prioridade e setor.', 'Acompanhe o tempo médio de resposta e de solução do atendimento.', 'Use a tabela de desempenho para comparar os técnicos.'] },
  { slug: 'como-abrir-seu-primeiro-chamado', title: 'Como abrir seu primeiro chamado', summary: 'Veja como registrar seu primeiro chamado no sistema.', category: 'TI', icon: 'headset', important: true, keywords: 'chamado abrir solicitação suporte',
    steps: ['Clique em "Novo chamado" no Dashboard ou em Chamados.', 'Escolha o seu setor e a categoria que melhor descreve o problema.', 'Escreva um título objetivo e descreva o problema com o máximo de detalhes.', 'Anexe prints ou arquivos, se ajudar, e clique em "Abrir Chamado".'] },
  { slug: 'como-acessar-o-conam', title: 'Como acessar o CONAM', summary: 'Entenda como entrar e navegar no sistema CONAM.', category: 'Financeiro', icon: 'monitor', keywords: 'conam sistema financeiro',
    steps: ['Acesse o endereço do CONAM pelo navegador da Prefeitura.', 'Entre com o usuário e a senha fornecidos pelo seu setor.', 'Se o acesso falhar, abra um chamado na categoria "Sistemas internos".'] },
  { slug: 'criacao-de-email', title: 'Criação de e-mail', summary: 'Saiba como solicitar seu e-mail institucional.', category: 'RH', icon: 'mail', keywords: 'email e-mail institucional novo servidor',
    steps: ['O RH envia o pedido de e-mail institucional ao Departamento de TI na admissão do servidor.', 'O padrão é nome.setor@ferrazdevasconcelos.sp.gov.br.', 'A TI entrega o usuário e a senha inicial; troque a senha no primeiro acesso.'] },
  { slug: 'acesso-ao-wifi', title: 'Acesso ao wi-fi', summary: 'Confira como conectar seus dispositivos à rede wi-fi.', category: 'Infraestrutura', icon: 'wifi', keywords: 'wifi wi-fi internet lenta rede proxy',
    steps: ['Selecione a rede institucional na lista de redes do dispositivo.', 'Entre com seu e-mail e senha institucionais.', 'Se a internet estiver lenta, reinicie o navegador e confira o proxy antes de abrir um chamado.', 'Persistindo o problema, abra um chamado na categoria "Rede / Internet".'] },
  { slug: 'alteracoes-no-site-da-prefeitura', title: 'Solicitar alterações no site oficial da Prefeitura', summary: 'Entenda como pedir atualizações no portal oficial.', category: 'Sistemas', icon: 'globe', keywords: 'site portal prefeitura alteração',
    steps: ['Abra um chamado na categoria "Sistemas internos".', 'Informe a página, o texto atual e o texto que deve ser publicado.', 'Anexe imagens ou documentos necessários.', 'A TI publica após a validação da área responsável.'] },
  { slug: 'manutencao-de-impressora', title: 'Como solicitar manutenção de impressora', summary: 'Passo a passo para reportar falhas de impressão e troca de toner.', category: 'Equipamentos', icon: 'printer', keywords: 'impressora toner papel scan',
    steps: ['Verifique se há papel na bandeja e se a impressora está ligada e online.', 'Anote a mensagem de erro exibida no visor.', 'Abra um chamado na categoria "Impressora" informando o modelo e o setor.'] },
  { slug: 'acesso-remoto-vpn', title: 'Acesso remoto (VPN)', summary: 'Como configurar a VPN para acessar sistemas fora da Prefeitura.', category: 'TI', icon: 'lock', keywords: 'vpn remoto home office acesso',
    steps: ['Solicite a liberação da VPN ao Departamento de TI.', 'Instale o cliente VPN indicado pela equipe.', 'Conecte com seu usuário institucional e acesse os sistemas normalmente.'] },
];
