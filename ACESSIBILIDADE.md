# Acessibilidade e Heurísticas de Usabilidade — Grape Desk

Documento de apoio ao projeto integrador. Descreve **quais heurísticas de Nielsen foram aplicadas**
(somente as que fazem sentido para um sistema de help desk) e **o que foi feito de acessibilidade**
(WCAG 2.1 nível AA e eMAG, o modelo de acessibilidade do governo brasileiro).

## 1. Heurísticas de Nielsen aplicadas

| # | Heurística | Como foi aplicada | Onde |
|---|------------|-------------------|------|
| 1 | Visibilidade do status do sistema | Notificações (toast) após criar chamado, mudar status, atribuir, comentar e cadastrar usuário; indicadores de "Carregando..."; contagem de resultados na busca; aviso "Alterações salvas automaticamente" | Toda a aplicação, `core/ui.service.ts` |
| 3 | Controle e liberdade do usuário | Botão Cancelar, links "Voltar", aviso ao sair do formulário com dados preenchidos ("Continuar editando"), botão "Limpar filtros", mostrar/ocultar senha | Criar Chamado, Chamados, Login |
| 5 | Prevenção de erros | Confirmação antes de encerrar/concluir chamado e de desativar usuário; alerta de Caps Lock; validação antes do envio; contador de caracteres no título; dica de formato nos campos | Detalhe do chamado, Usuários, Login, Criar Chamado |
| 6 | Reconhecimento em vez de memorização | Menu com item ativo destacado, breadcrumb nas telas internas, filtros ativos visíveis, buscas populares, placeholders com exemplos | Menu, Chamados, Base de Conhecimento |
| 7 | Flexibilidade e eficiência de uso | Atalhos de teclado: `Alt+1` conteúdo, `Alt+2` menu, `Alt+3` busca, `/` buscar, `N` novo chamado, `?` ajuda | Todas as telas (após o login) |
| 9 | Ajudar a reconhecer, diagnosticar e corrigir erros | Mensagens específicas em linguagem simples, ao lado do campo, com resumo de erros no topo do formulário e links que levam ao campo com problema | Login, Criar Chamado, Usuários |
| 10 | Ajuda e documentação | Botão de Ajuda (`?`) com atalhos e contatos, Base de Conhecimento, dicas no formulário de chamado | Cabeçalho, Base de Conhecimento |

Heurísticas **2** (linguagem do mundo real), **4** (consistência) e **8** (design minimalista) já são atendidas
pelo próprio layout: textos em português, mesmos componentes e cores em todas as telas e interface limpa.
A heurística **3/5** também aparece como "desfazer" em ações simples (ex.: status pode ser alterado de volta).

## 2. Acessibilidade (WCAG 2.1 AA / eMAG)

**Percepção**
- Contraste mínimo de 4,5:1 para textos (cores de status e variações foram ajustadas).
- Texto redimensionável (100%, 112%, 125% e 150%) sem perder conteúdo: tamanhos em `rem`, nenhum texto menor que 12px.
- **Modo de alto contraste** (preto, branco e amarelo) e opção **Reduzir animações** (também respeita `prefers-reduced-motion`).
- Gráficos com alternativa em texto (`aria-label` com os valores); avaliações por estrelas com texto equivalente.
- Cor nunca é o único meio de informação: status e prioridades sempre aparecem escritos.

**Operação**
- Todo o sistema funciona só com teclado; foco sempre visível (anel escuro com halo branco).
- Link "Ir para o conteúdo principal" e atalhos `Alt+1/2/3` (padrão eMAG).
- Linhas de tabela com link real no número do chamado (acessível por teclado e leitor de tela).
- Janelas de confirmação e ajuda usam `<dialog>` nativo: foco preso na janela, `Esc` fecha e o foco volta ao ponto de origem.
- Área de anexos operável por teclado (`Enter`/`Espaço`).

**Compreensão**
- Idioma da página definido (`pt-BR`), título da aba muda a cada tela.
- Rótulos associados a todos os campos; campos obrigatórios indicados no texto e no leitor de tela.
- Erros em `role="alert"`, avisos de status em `aria-live="polite"`.

**Robustez**
- Marcos semânticos (cabeçalho, menu, `main`, busca, barra lateral), `aria-current` no menu, `aria-expanded` em menus recolhíveis,
  `role="switch"` + `aria-checked` nos interruptores, tabelas com `caption` e `scope`, um único `h1` por tela.
- Foco é levado ao conteúdo a cada troca de página (leitores de tela anunciam a nova tela).

## 3. Como foi verificado
- Auditoria automática com **axe-core** (regras WCAG 2.0/2.1 A e AA + boas práticas) em todas as 10 telas: **0 violações**.
- Testes no navegador: validação do formulário, foco após erro, atalhos, janelas de confirmação, alto contraste e texto a 150%.
- **Ainda recomendado:** teste manual com leitor de tela (NVDA, no Windows) e com usuários reais.

## 4. Próximos passos sugeridos
- Integrar o **VLibras** (tradutor para Libras do governo federal), comum em sites de prefeituras.
- Testes com NVDA/JAWS e revisão do conteúdo por pessoas com deficiência.
- Desfazer (Ctrl+Z) para alteração de status.
