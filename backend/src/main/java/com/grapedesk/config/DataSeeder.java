package com.grapedesk.config;

import com.grapedesk.domain.*;
import com.grapedesk.repository.ArticleRepository;
import com.grapedesk.repository.CategoryRepository;
import com.grapedesk.repository.TicketRepository;
import com.grapedesk.repository.UserRepository;
import com.grapedesk.service.SettingsService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

/** Popula o banco com configurações, categorias, usuários e artigos de demonstração na primeira execução. */
@Component
public class DataSeeder implements CommandLineRunner {
    private final UserRepository users;
    private final CategoryRepository categories;
    private final TicketRepository tickets;
    private final ArticleRepository articles;
    private final SettingsService settings;
    private final PasswordEncoder encoder;

    @Override
    public void run(String... args) {
        settings.current();

        if (categories.count() == 0) {
            categories.saveAll(List.of(
                    new Category("Hardware"), new Category("Software"), new Category("Rede / Internet"),
                    new Category("Impressora"), new Category("Acesso / Senha"),
                    new Category("Sistemas internos"), new Category("Outros")));
        }
        if (users.count() == 0) {
            User admin = user("João Castro", "admin@ferrazdevasconcelos.sp.gov.br", "admin123", Role.ADMIN, "Estagiário de TI");
            User tech = user("Nicolas Silva", "tecnico@ferrazdevasconcelos.sp.gov.br", "tecnico123", Role.TECHNICIAN, "Técnico de Suporte");
            User servidor = user("José Antonio", "jose.antonio@ferrazdevasconcelos.sp.gov.br", "senha123", Role.USER, "Recursos Humanos");
            users.saveAll(List.of(admin, tech, servidor));

            Ticket t = new Ticket();
            t.setTitle("Impressora do setor não imprime");
            t.setDescription("A impressora da sala 3 mostra erro de papel, mas a bandeja está cheia.");
            t.setPriority(TicketPriority.MEDIUM);
            t.setSector("Recursos Humanos");
            t.setCategory(categories.findAll().stream().filter(c -> c.getName().equals("Impressora")).findFirst().orElseThrow());
            t.setRequester(servidor);
            tickets.save(t);
        }
        if (articles.count() == 0) seedArticles();
    }

    private void seedArticles() {
        articles.saveAll(List.of(
            article("como-definir-sua-senha", "Como definir sua senha", "Aprenda a criar ou redefinir sua senha de acesso.", "TI", "lock", true, "senha acesso login redefinir",
                "Use uma senha com pelo menos 8 caracteres, misturando letras, números e símbolos.",
                "Evite datas de aniversário, nomes e sequências como 123456.",
                "Para redefinir, procure o Departamento de TI ou abra um chamado na categoria \"Acesso / Senha\".",
                "Após receber a senha temporária, entre no sistema e troque-a imediatamente."),
            article("integracoes-disponiveis", "Integrações disponíveis", "Consulte as integrações do sistema e saiba como utilizá-las.", "Sistemas", "plug", false, "integrações api whatsapp",
                "Acesse Configurações > Integrações para ver as integrações disponíveis.",
                "Atualmente o Grape Desk prevê integração com o chatbot de WhatsApp para triagem de chamados.",
                "Cada integração exige autorização do Departamento de TI antes de ser ativada."),
            article("relatorios-primeiros-passos", "Relatórios: primeiros passos", "Aprenda a gerar e personalizar seus relatórios.", "Sistemas", "file-text", false, "relatórios indicadores desempenho",
                "Abra o menu Relatórios na barra lateral.",
                "Veja os indicadores de chamados por mês, prioridade e setor.",
                "Acompanhe o tempo médio de resposta e de solução do atendimento.",
                "Use a tabela de desempenho para comparar os técnicos."),
            article("como-abrir-seu-primeiro-chamado", "Como abrir seu primeiro chamado", "Veja como registrar seu primeiro chamado no sistema.", "TI", "headset", true, "chamado abrir solicitação suporte",
                "Clique em \"Novo chamado\" no Dashboard ou em Chamados.",
                "Escolha o seu setor e a categoria que melhor descreve o problema.",
                "Escreva um título objetivo e descreva o problema com o máximo de detalhes.",
                "Anexe prints ou arquivos, se ajudar, e clique em \"Abrir Chamado\"."),
            article("como-acessar-o-conam", "Como acessar o CONAM", "Entenda como entrar e navegar no sistema CONAM.", "Financeiro", "monitor", false, "conam sistema financeiro",
                "Acesse o endereço do CONAM pelo navegador da Prefeitura.",
                "Entre com o usuário e a senha fornecidos pelo seu setor.",
                "Se o acesso falhar, abra um chamado na categoria \"Sistemas internos\"."),
            article("criacao-de-email", "Criação de e-mail", "Saiba como solicitar seu e-mail institucional.", "RH", "mail", false, "email e-mail institucional novo servidor",
                "O RH envia o pedido de e-mail institucional ao Departamento de TI na admissão do servidor.",
                "O padrão é nome.setor@ferrazdevasconcelos.sp.gov.br.",
                "A TI entrega o usuário e a senha inicial; troque a senha no primeiro acesso."),
            article("acesso-ao-wifi", "Acesso ao wi-fi", "Confira como conectar seus dispositivos à rede wi-fi.", "Infraestrutura", "wifi", false, "wifi wi-fi internet lenta rede proxy",
                "Selecione a rede institucional na lista de redes do dispositivo.",
                "Entre com seu e-mail e senha institucionais.",
                "Se a internet estiver lenta, reinicie o navegador e confira o proxy antes de abrir um chamado.",
                "Persistindo o problema, abra um chamado na categoria \"Rede / Internet\"."),
            article("alteracoes-no-site-da-prefeitura", "Solicitar alterações no site oficial da Prefeitura", "Entenda como pedir atualizações no portal oficial.", "Sistemas", "globe", false, "site portal prefeitura alteração",
                "Abra um chamado na categoria \"Sistemas internos\".",
                "Informe a página, o texto atual e o texto que deve ser publicado.",
                "Anexe imagens ou documentos necessários.",
                "A TI publica após a validação da área responsável."),
            article("manutencao-de-impressora", "Como solicitar manutenção de impressora", "Passo a passo para reportar falhas de impressão e troca de toner.", "Equipamentos", "printer", false, "impressora toner papel scan",
                "Verifique se há papel na bandeja e se a impressora está ligada e online.",
                "Anote a mensagem de erro exibida no visor.",
                "Abra um chamado na categoria \"Impressora\" informando o modelo e o setor."),
            article("acesso-remoto-vpn", "Acesso remoto (VPN)", "Como configurar a VPN para acessar sistemas fora da Prefeitura.", "TI", "lock", false, "vpn remoto home office acesso",
                "Solicite a liberação da VPN ao Departamento de TI.",
                "Instale o cliente VPN indicado pela equipe.",
                "Conecte com seu usuário institucional e acesse os sistemas normalmente.")
        ));
    }

    private Article article(String slug, String title, String summary, String category, String icon, boolean important, String keywords, String... steps) {
        Article a = new Article();
        a.setSlug(slug);
        a.setTitle(title);
        a.setSummary(summary);
        a.setCategory(category);
        a.setIcon(icon);
        a.setImportant(important);
        a.setKeywords(keywords);
        a.setSteps(String.join("\n", steps));
        return a;
    }

    private User user(String name, String email, String rawPassword, Role role, String dept) {
        User u = new User();
        u.setName(name);
        u.setEmail(email);
        u.setPassword(encoder.encode(rawPassword));
        u.setRole(role);
        u.setDepartment(dept);
        return u;
    }

    public DataSeeder(UserRepository users, CategoryRepository categories, TicketRepository tickets, ArticleRepository articles, SettingsService settings, PasswordEncoder encoder) {
        this.users = users;
        this.categories = categories;
        this.tickets = tickets;
        this.articles = articles;
        this.settings = settings;
        this.encoder = encoder;
    }
}
