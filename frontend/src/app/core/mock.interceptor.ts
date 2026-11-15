import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { delay, of, throwError } from 'rxjs';
import { API_URL, USE_MOCK } from './api';
import { KB_ARTICLES } from './kb.data';
import { Category, Comment, ReportSummary, Role, Ticket, TicketPriority, TicketStatus, User } from './models';

type MockUser = User & { password: string };

const DOMAIN = '@ferrazdevasconcelos.sp.gov.br';

const users: MockUser[] = [
  { id: 1, name: 'João Castro', email: 'admin' + DOMAIN, password: 'admin123', role: 'ADMIN', department: 'Estagiário de TI', active: true },
  { id: 2, name: 'Nicolas Silva', email: 'tecnico' + DOMAIN, password: 'tecnico123', role: 'TECHNICIAN', department: 'Técnico de Suporte', active: true },
  { id: 3, name: 'Herick Soares', email: 'herick.soares' + DOMAIN, password: 'tecnico123', role: 'TECHNICIAN', department: 'Técnico de Suporte', active: true },
  { id: 4, name: 'Cauan Ferreira', email: 'cauan.ferreira' + DOMAIN, password: 'tecnico123', role: 'TECHNICIAN', department: 'Técnico de Suporte', active: true },
  { id: 5, name: 'João Nascimento', email: 'joao.nascimento' + DOMAIN, password: 'tecnico123', role: 'TECHNICIAN', department: 'Técnico de Suporte', active: true },
  { id: 6, name: 'José Antonio', email: 'jose.antonio' + DOMAIN, password: 'senha123', role: 'USER', department: 'Recursos Humanos', active: true },
  { id: 7, name: 'Eneias Silva', email: 'eneias.silva' + DOMAIN, password: 'senha123', role: 'USER', department: 'Administração', active: true },
  { id: 8, name: 'Cristiano Paiva', email: 'cristiano.paiva' + DOMAIN, password: 'senha123', role: 'USER', department: 'Equipamentos', active: true },
  { id: 9, name: 'Alex Sabino', email: 'alex.sabino' + DOMAIN, password: 'senha123', role: 'USER', department: 'Infraestrutura', active: true },
  { id: 10, name: 'Telina Gomes', email: 'telina.gomes' + DOMAIN, password: 'senha123', role: 'USER', department: 'Infraestrutura', active: true },
  { id: 11, name: 'Luiz Claudio', email: 'luiz.claudio' + DOMAIN, password: 'senha123', role: 'USER', department: 'Financeiro', active: true },
];
const categories: Category[] = ['Hardware', 'Software', 'Rede / Internet', 'Impressora', 'Acesso / Senha', 'Sistemas internos', 'Outros']
  .map((name, i) => ({ id: i + 1, name }));
const catId = (name: string) => categories.find((c) => c.name === name)!;

const pub = (u: MockUser): User => ({ id: u.id, name: u.name, email: u.email, role: u.role, department: u.department, active: u.active });
const byId = (id: number) => users.find((u) => u.id === id)!;
const techs = () => users.filter((u) => u.role === 'TECHNICIAN' || u.role === 'ADMIN');

function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(42);
const shuffle = <T>(arr: T[]): T[] => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
const expand = <T>(pairs: [T, number][]): T[] => pairs.flatMap(([v, n]) => Array<T>(n).fill(v));

let ticketSeq = 1630;
let commentSeq = 0;
let attachmentSeq = 0;
const tickets: Ticket[] = [];
const now = new Date();
const todayAt = (h: number, m: number) => { const d = new Date(); d.setHours(h, m, 0, 0); return d.toISOString(); };

function addTicket(t: Omit<Ticket, 'id' | 'comments' | 'closedAt'> & { comments?: [number, string][] }, id?: number) {
  const done = t.status === 'RESOLVED' || t.status === 'CLOSED';
  tickets.push({
    ...t, id: id ?? ++ticketSeq, closedAt: done ? t.updatedAt : null,
    comments: (t.comments ?? []).map(([author, content]) => ({ id: ++commentSeq, content, author: pub(byId(author)), createdAt: t.updatedAt })),
  });
}

const pool: [string, string][] = [
  ['Computador muito lento', 'Hardware'], ['Teclado não funciona', 'Hardware'], ['Monitor sem imagem', 'Hardware'], ['Mouse falhando', 'Hardware'],
  ['Erro ao abrir o Word', 'Software'], ['Instalar leitor de PDF', 'Software'], ['Antivírus bloqueando sistema', 'Software'],
  ['Wi-Fi caindo toda hora', 'Rede / Internet'], ['Sem acesso à rede interna', 'Rede / Internet'], ['Internet lenta', 'Rede / Internet'],
  ['Impressora com papel atolado', 'Impressora'], ['Impressora offline', 'Impressora'], ['Trocar toner da impressora', 'Impressora'],
  ['Esqueci minha senha', 'Acesso / Senha'], ['Conta bloqueada', 'Acesso / Senha'], ['Solicitar acesso a sistema', 'Acesso / Senha'],
  ['Sistema de protocolo travando', 'Sistemas internos'], ['Erro no sistema de ponto', 'Sistemas internos'], ['CONAM com erro', 'Sistemas internos'],
  ['Solicitação de ramal', 'Outros'], ['Mudança de ponto de rede', 'Outros'],
];
const fStatus = shuffle(expand<TicketStatus>([['IN_PROGRESS', 19], ['WAITING', 7], ['RESOLVED', 90], ['OPEN', 13], ['CLOSED', 20]]));
const fPrio = shuffle(expand<TicketPriority>([['HIGH', 12], ['MEDIUM', 40], ['LOW', 97]]));
const fSector = shuffle(expand<string>([['Recursos Humanos', 21], ['Infraestrutura', 38], ['Administração', 25], ['Financeiro', 14], ['Equipamentos', 29], ['Outros', 22]]));
const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
const clients = users.filter((u) => u.role === 'USER');

for (let i = 0; i < 149; i++) {
  const [title, cat] = pool[Math.floor(rnd() * pool.length)];
  const created = monthStart + rnd() * Math.max(now.getTime() - monthStart - 3600_000, 1);
  const updated = Math.min(now.getTime(), created + rnd() * 72 * 3600_000);
  const status = fStatus[i];
  addTicket({
    title, description: `${title}. Chamado aberto pelo setor para análise da equipe de TI.`, status, priority: fPrio[i], sector: fSector[i],
    category: catId(cat), requester: pub(clients[Math.floor(rnd() * clients.length)]),
    assignee: status === 'OPEN' ? null : pub(byId(1 + Math.floor(rnd() * 5))),
    createdAt: new Date(created).toISOString(), updatedAt: new Date(updated).toISOString(),
  });
}

const design: [number, string, TicketStatus, TicketPriority, number, string, string, number, number, number, [number, string][]?][] = [
  [1780, 'Conam não funciona', 'IN_PROGRESS', 'HIGH', 11, 'Financeiro', 'Sistemas internos', 9, 35, 1, [[1, 'Estou verificando o acesso do usuário ao CONAM.']]],
  [1781, 'Sem internet', 'RESOLVED', 'MEDIUM', 10, 'Infraestrutura', 'Rede / Internet', 10, 44, 5, [[5, 'Cabo de rede substituído. Conexão normalizada.']]],
  [1782, 'Estou sem internet', 'RESOLVED', 'LOW', 9, 'Infraestrutura', 'Rede / Internet', 11, 5, 4, [[4, 'Reiniciamos o switch do setor e a internet voltou.']]],
  [1783, 'Computador liga e não da video', 'IN_PROGRESS', 'HIGH', 8, 'Equipamentos', 'Hardware', 8, 32, 3, [[3, 'Vou levar o equipamento para a bancada e testar a placa de vídeo.']]],
  [1784, 'Impressora não faz Scan', 'WAITING', 'MEDIUM', 7, 'Administração', 'Impressora', 10, 34, 2, [[2, 'Pode informar o modelo da impressora e se aparece alguma mensagem no visor?']]],
  [1785, 'Não consigo acessar minha conta', 'IN_PROGRESS', 'HIGH', 6, 'Recursos Humanos', 'Acesso / Senha', 10, 35, 1, [[1, 'Estou redefinindo sua senha. Em instantes envio os dados.']]],
];
for (const [id, title, status, priority, req, sector, cat, h, m, assignee, comments] of design) {
  const updated = todayAt(h, m);
  addTicket({
    title, description: `${title}. Preciso de ajuda da equipe de TI o quanto antes.`, status, priority, sector, category: catId(cat),
    requester: pub(byId(req)), assignee: pub(byId(assignee)),
    createdAt: new Date(new Date(updated).getTime() - 3600_000).toISOString(), updatedAt: updated, comments,
  }, id);
}

ticketSeq = Math.max(ticketSeq, ...tickets.map((t) => t.id)); // próximos chamados continuam depois do #1785

class ApiError { constructor(public status: number, public message: string) {} }
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const isStaff = (u: User) => u.role !== 'USER';
const requireStaff = (u: User) => { if (!isStaff(u)) throw new ApiError(403, 'Apenas a equipe de TI pode fazer isso'); };

function currentUser(req: HttpRequest<unknown>): MockUser {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
  const u = token.startsWith('mock-') ? users.find((x) => x.id === +token.slice(5) && x.active) : undefined;
  if (!u) throw new ApiError(401, 'Não autenticado');
  return u;
}
const visible = (u: User) => tickets.filter((t) => isStaff(u) || t.requester.id === u.id);
function findTicket(u: User, id: number): Ticket {
  const t = tickets.find((x) => x.id === id);
  if (!t) throw new ApiError(404, 'Chamado não encontrado');
  if (!isStaff(u) && t.requester.id !== u.id) throw new ApiError(403, 'Você não tem acesso a este chamado');
  return t;
}
function allowReopenEnabled(): boolean {
  try { return JSON.parse(localStorage.getItem('grapedesk.settings') ?? '{}').allowReopen ?? false; } catch { return false; }
}
function autoAssignEnabled(): boolean {
  try { return JSON.parse(localStorage.getItem('grapedesk.settings') ?? '{}').autoAssign ?? true; } catch { return true; }
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const TMR: Record<number, [string, number]> = { 1: ['1h 45min', 5], 2: ['2h 10min', 4], 3: ['1h 55min', 4], 4: ['2h 25min', 3], 5: ['2h 40min', 3] };

function reportSummary(): ReportSummary {
  const all = tickets;
  const count = <K>(key: (t: Ticket) => K) => { const m = new Map<K, number>(); all.forEach((t) => m.set(key(t), (m.get(key(t)) ?? 0) + 1)); return m; };
  const prio = count((t) => t.priority);
  const sec = count((t) => t.sector);
  const history = [98, 110, 126, 98, 132, all.length];
  const monthly = history.map((value, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { label: `${MONTHS[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`, value };
  });
  const sectors = [...sec.entries()].map(([sector, c]) => ({ sector, count: c })).sort((a, b) => b.count - a.count);
  return {
    total: all.length,
    monthly,
    priority: (['HIGH', 'MEDIUM', 'LOW'] as TicketPriority[]).map((p) => ({ priority: p, count: prio.get(p) ?? 0 })),
    sectors,
    avgResponse: { value: '15 min', delta: -8 },
    avgResolution: { value: '1h 20min', delta: -12 },
    technicians: techs().map((u) => ({
      id: u.id, name: u.name,
      resolved: all.filter((t) => t.assignee?.id === u.id && (t.status === 'RESOLVED' || t.status === 'CLOSED')).length,
      inProgress: all.filter((t) => t.assignee?.id === u.id && t.status === 'IN_PROGRESS').length,
      tmr: TMR[u.id][0], rating: TMR[u.id][1],
    })),
    satisfaction: { average: 4.7, positivePct: 92 },
    insights: [
      { icon: 'printer', text: 'Chamados de impressora aumentaram 18% em relação ao mês anterior.' },
      { icon: 'users', text: `Setor ${sectors[0]?.sector ?? '—'} teve o maior volume de chamados este mês.` },
      { icon: 'clock', text: 'Tempo médio de resolução caiu 12% em relação ao mês anterior.' },
      { icon: 'target', text: 'Falhas recorrentes detectadas em 3 equipamentos no setor Financeiro.' },
    ],
  };
}

function handle(req: HttpRequest<any>): { status: number; body: unknown } {
  const path = req.url.substring(API_URL.length).split('?')[0];
  const m = req.method;
  const ok = (body: unknown, status = 200) => ({ status, body: clone(body) });
  let r: RegExpMatchArray | null;

  if (m === 'POST' && path === '/auth/login') {
    const u = users.find((x) => x.email.toLowerCase() === String(req.body.email).toLowerCase() && x.password === req.body.password && x.active);
    if (!u) throw new ApiError(401, 'E-mail ou senha inválidos');
    return ok({ token: 'mock-' + u.id, user: pub(u) });
  }

  const me = currentUser(req);

  if (m === 'GET' && path === '/auth/me') return ok(pub(me));
  if (m === 'GET' && path === '/categories') return ok(categories);
  if (m === 'GET' && path === '/reports/summary') { requireStaff(me); return ok(reportSummary()); }

  if (m === 'GET' && path === '/tickets/stats') {
    const l = visible(me);
    const n = (s: TicketStatus) => l.filter((t) => t.status === s).length;
    return ok({ total: l.length, open: n('OPEN'), inProgress: n('IN_PROGRESS'), waiting: n('WAITING'), resolved: n('RESOLVED'), closed: n('CLOSED'),
      totalDelta: 12, inProgressDelta: 7, resolvedDelta: 35, waitingDelta: -5 });
  }
  if (m === 'GET' && path === '/tickets') {
    const status = req.params.get('status');
    const q = (req.params.get('q') ?? '').toLowerCase();
    const l = visible(me)
      .filter((t) => (!status || t.status === status) && (!q || t.title.toLowerCase().includes(q) || String(t.id).includes(q)))
      .sort((a, b) => b.id - a.id)
      .map((t) => ({ ...t, comments: [] }));
    return ok(l);
  }
  if (m === 'POST' && path === '/tickets') {
    const b = req.body;
    const cat = categories.find((c) => c.id === b.categoryId);
    if (!cat) throw new ApiError(400, 'Categoria inválida');
    const stamp = new Date().toISOString();
    const t: Ticket = {
      id: ++ticketSeq, title: String(b.title).trim(), description: String(b.description).trim(), status: 'OPEN',
      priority: b.priority ?? 'MEDIUM', sector: b.sector, category: cat, requester: pub(me), assignee: null,
      createdAt: stamp, updatedAt: stamp, closedAt: null, comments: [], attachments: [],
    };
    if (autoAssignEnabled()) {
      const load = (u: User) => tickets.filter((x) => x.assignee?.id === u.id && x.status === 'IN_PROGRESS').length;
      const pick = [...techs()].sort((a, c) => load(a) - load(c))[0];
      t.assignee = pub(pick);
      t.status = 'IN_PROGRESS';
    }
    tickets.push(t);
    return ok(t, 201);
  }
  if ((r = path.match(/^\/tickets\/(\d+)$/)) && m === 'GET') return ok(findTicket(me, +r[1]));

  if ((r = path.match(/^\/tickets\/(\d+)\/status$/)) && m === 'PATCH') {
    requireStaff(me);
    const t = findTicket(me, +r[1]);
    t.status = req.body.status;
    const done = t.status === 'RESOLVED' || t.status === 'CLOSED';
    t.closedAt = done ? new Date().toISOString() : null;
    if (!t.assignee && t.status === 'IN_PROGRESS') t.assignee = pub(me);
    t.updatedAt = new Date().toISOString();
    return ok(t);
  }
  if ((r = path.match(/^\/tickets\/(\d+)\/assignee$/)) && m === 'PATCH') {
    requireStaff(me);
    const t = findTicket(me, +r[1]);
    const id = req.body.assigneeId as number | null;
    if (id == null) t.assignee = null;
    else {
      const a = users.find((u) => u.id === id && u.active && isStaff(u));
      if (!a) throw new ApiError(400, 'Técnico inválido');
      t.assignee = pub(a);
      if (t.status === 'OPEN') t.status = 'IN_PROGRESS';
    }
    t.updatedAt = new Date().toISOString();
    return ok(t);
  }
  if ((r = path.match(/^\/tickets\/(\d+)\/comments$/)) && m === 'POST') {
    const t = findTicket(me, +r[1]);
    if (t.status === 'CLOSED') throw new ApiError(400, 'Chamado encerrado não aceita novos comentários');
    const c: Comment = { id: ++commentSeq, content: String(req.body.content).trim(), author: pub(me), createdAt: new Date().toISOString() };
    t.comments.push(c);
    t.updatedAt = c.createdAt;
    return ok(t, 201);
  }

  if ((r = path.match(/^\/tickets\/(\d+)\/attachments$/)) && m === 'POST') {
    const t = findTicket(me, +r[1]);
    const files = (req.body as FormData).getAll('files') as File[];
    t.attachments = t.attachments ?? [];
    files.forEach((f) => t.attachments!.push({ id: ++attachmentSeq, name: f.name, size: f.size }));
    t.updatedAt = new Date().toISOString();
    return ok(t, 201);
  }
  if ((r = path.match(/^\/tickets\/(\d+)\/reopen$/)) && m === 'POST') {
    const t = findTicket(me, +r[1]);
    if (t.status !== 'RESOLVED' && t.status !== 'CLOSED') throw new ApiError(400, 'Só é possível reabrir chamados concluídos ou encerrados');
    if (!isStaff(me) && !allowReopenEnabled()) throw new ApiError(403, 'A reabertura de chamados não está habilitada. Abra um novo chamado.');
    t.status = t.assignee ? 'IN_PROGRESS' : 'OPEN';
    t.closedAt = null;
    t.updatedAt = new Date().toISOString();
    return ok(t);
  }
  if ((r = path.match(/^\/tickets\/(\d+)\/rating$/)) && m === 'POST') {
    const t = findTicket(me, +r[1]);
    if (t.requester.id !== me.id) throw new ApiError(403, 'Apenas quem abriu o chamado pode avaliá-lo');
    if (t.status !== 'RESOLVED' && t.status !== 'CLOSED') throw new ApiError(400, 'Você poderá avaliar quando o chamado for concluído');
    const n = Number(req.body.rating);
    if (!(n >= 1 && n <= 5)) throw new ApiError(400, 'A nota deve ser de 1 a 5');
    t.rating = n;
    t.ratingComment = String(req.body.comment ?? '').trim() || null;
    return ok(t);
  }
  if ((r = path.match(/^\/attachments\/(\d+)$/)) && m === 'GET') {
    const exists = tickets.some((t) => t.attachments?.some((a) => a.id === +r![1]));
    if (!exists) throw new ApiError(404, 'Anexo não encontrado');
    return { status: 200, body: new Blob(['Arquivo de demonstração (modo sem backend).'], { type: 'text/plain' }) };
  }
  if (m === 'GET' && path === '/kb/articles') {
    const q = (req.params.get('q') ?? '').toLowerCase();
    const cat = req.params.get('category');
    return ok(KB_ARTICLES.map((a, i) => ({ ...a, id: i + 1 }))
      .filter((a) => (!cat || a.category === cat) && (!q || (a.title + ' ' + a.summary + ' ' + a.keywords).toLowerCase().includes(q))));
  }
  if ((r = path.match(/^\/kb\/articles\/([\w-]+)$/)) && m === 'GET') {
    const a = KB_ARTICLES.find((x) => x.slug === r![1]);
    if (!a) throw new ApiError(404, 'Artigo não encontrado');
    return ok(a);
  }

  if (m === 'GET' && path === '/users/staff') { requireStaff(me); return ok(techs().filter((u) => u.active).map(pub)); }
  if (path.startsWith('/users')) {
    if (me.role !== 'ADMIN') throw new ApiError(403, 'Acesso negado');
    if (m === 'GET' && path === '/users') return ok(users.map(pub));
    if (m === 'POST' && path === '/users') {
      const b = req.body;
      if (users.some((u) => u.email.toLowerCase() === String(b.email).toLowerCase())) throw new ApiError(409, 'Já existe um usuário com este e-mail');
      const u: MockUser = { id: users.length + 1, name: b.name, email: String(b.email).toLowerCase(), password: b.password, role: b.role as Role, department: b.department, active: true };
      users.push(u);
      return ok(pub(u), 201);
    }
    if ((r = path.match(/^\/users\/(\d+)\/active$/)) && m === 'PATCH') {
      const u = users.find((x) => x.id === +r![1]);
      if (!u) throw new ApiError(404, 'Usuário não encontrado');
      u.active = req.params.get('value') === 'true';
      return ok(pub(u));
    }
  }
  throw new ApiError(404, 'Rota não encontrada (mock)');
}

export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!USE_MOCK || !req.url.startsWith(API_URL)) return next(req);
  try {
    const { status, body } = handle(req);
    return of(new HttpResponse({ status, body })).pipe(delay(200));
  } catch (e) {
    if (e instanceof ApiError) {
      return throwError(() => new HttpErrorResponse({ status: e.status, error: { message: e.message }, url: req.url })).pipe(delay(200));
    }
    throw e;
  }
};
