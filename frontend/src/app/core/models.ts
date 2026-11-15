export type Role = 'USER' | 'TECHNICIAN' | 'ADMIN';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User { id: number; name: string; email: string; role: Role; department?: string; active: boolean; }
export interface Category { id: number; name: string; }
export interface Comment { id: number; content: string; author: User; createdAt: string; }
export interface Attachment { id: number; name: string; size: number; }
export interface Ticket {
  id: number; title: string; description: string; status: TicketStatus; priority: TicketPriority;
  sector: string; category: Category; requester: User; assignee?: User | null;
  createdAt: string; updatedAt: string; closedAt?: string | null; comments: Comment[]; attachments?: Attachment[]; rating?: number | null; ratingComment?: string | null;
}
export interface Stats {
  total: number; open: number; inProgress: number; waiting: number; resolved: number; closed: number;
  
  totalDelta?: number | null; inProgressDelta?: number | null; resolvedDelta?: number | null; waitingDelta?: number | null;
}
export interface LoginResponse { token: string; user: User; }

export const STATUS_LABEL: Record<TicketStatus, string> = {
  OPEN: 'Aberto', IN_PROGRESS: 'Em andamento', WAITING: 'Aguardando Cliente', RESOLVED: 'Concluído', CLOSED: 'Encerrado',
};
export const PRIORITY_LABEL: Record<TicketPriority, string> = {
  LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta', CRITICAL: 'Crítica',
};
export const ROLE_LABEL: Record<Role, string> = { USER: 'Usuário', TECHNICIAN: 'Técnico', ADMIN: 'Administrador' };
export const STATUSES = Object.keys(STATUS_LABEL) as TicketStatus[];
export const PRIORITIES = Object.keys(PRIORITY_LABEL) as TicketPriority[];
export const ROLES = Object.keys(ROLE_LABEL) as Role[];

export function errMsg(err: any): string {
  return err?.error?.message || (err?.status === 0 ? 'Não foi possível conectar ao servidor.' : 'Erro inesperado. Tente novamente.');
}

export const SECTORS = ['Administração', 'Educação', 'Equipamentos', 'Financeiro', 'Infraestrutura', 'Recursos Humanos', 'Saúde', 'Outros'];

export interface TechPerformance { id: number; name: string; resolved: number; inProgress: number; tmr: string; rating: number; }
export interface ReportSummary {
  total: number;
  monthly: { label: string; value: number }[];
  priority: { priority: TicketPriority; count: number }[];
  sectors: { sector: string; count: number }[];
  avgResponse: { value: string; delta: number };
  avgResolution: { value: string; delta: number };
  technicians: TechPerformance[];
  satisfaction: { average: number; positivePct: number };
  insights: { icon: string; text: string }[];
}

export function friendlyDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const now = new Date();
  const same = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  return same ? `Hoje, ${hm}` : `${pad(d.getDate())}/${pad(d.getMonth() + 1)}, ${hm}`;
}

export function initials(name: string): string {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
}
