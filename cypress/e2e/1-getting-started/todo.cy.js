// ==========================================
// TESTES CYPRESS PARA O SITE NOMAP
// ==========================================

// 1. TESTE DE ACESSO À PÁGINA INICIAL
describe('Abertura do Site NoMap', () => {
  it('Deve acessar a página inicial corretamente', () => {
    cy.visit('/');
    cy.contains('NoMap').should('be.visible');
    cy.get('header').should('be.visible');
  });

  it('Deve exibir o logo na página inicial', () => {
    cy.visit('/');
    cy.get('img[alt="Logo NoMap"]').should('be.visible');
  });
});

// 2. TESTES DE NAVEGAÇÃO PELOS BOTÕES DO HEADER
describe('Navegação pelos Botões do Header', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('Clicar no logo deve manter/retornar à página inicial', () => {
    cy.get('a.navbar-brand').first().click();
    cy.url().should('include', 'index.html').or('not.include', '/places');
  });

  it('Clicar em "Países em Destaque" deve ir para intro.html', () => {
    cy.get('#navigationDropdown').click();
    cy.contains('Países em Destaque').click();
    cy.url().should('include', 'intro.html');
  });

  it('Clicar em "Todos os Países" deve ir para places.html', () => {
    cy.get('#navigationDropdown').click();
    cy.contains('Todos os Países').click();
    cy.url().should('include', 'places.html');
  });

  it('Clicar em "Quem Somos" deve ir para about.html', () => {
    cy.get('#navigationDropdown').click();
    cy.contains('Quem Somos').click();
    cy.url().should('include', 'about.html');
  });

  it('Clicar em "Nossa Missão" deve ir para mission.html', () => {
    cy.get('#navigationDropdown').click();
    cy.contains('Nossa Missão').click();
    cy.url().should('include', 'mission.html');
  });
});

// 3. TESTES DE BOTÕES DA PÁGINA INICIAL (HERO E CARDS)
describe('Botões de Ação da Página Inicial', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('Botão "Explorar Países" do hero deve ir para places.html', () => {
    cy.contains('Explorar Países').first().click();
    cy.url().should('include', 'places.html');
  });

  it('Botão "Ver Destaques" do hero deve ir para intro.html', () => {
    cy.contains('Ver Destaques').click();
    cy.url().should('include', 'intro.html');
  });

  it('Card "Países em Destaque" deve ter link funcional', () => {
    cy.contains('Países em Destaque').parents('.card').find('a').click();
    cy.url().should('include', 'intro.html');
  });

  it('Card "Todos os Países" deve ter link funcional', () => {
    cy.contains('Todos os Países').parents('.card').find('a').first().click();
    cy.url().should('include', 'places.html');
  });
});

// 3. TESTES DE BOTÕES DA PÁGINA INICIAL (HERO E CARDS)
describe('Botões de Ação da Página Inicial', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('Botão "Explorar Países" do hero deve ir para places.html', () => {
    cy.contains('Explorar Países').first().click();
    cy.url().should('include', 'places.html');
  });

  it('Botão "Ver Destaques" do hero deve ir para intro.html', () => {
    cy.contains('Ver Destaques').click();
    cy.url().should('include', 'intro.html');
  });

  it('Card "Países em Destaque" deve ter link funcional', () => {
    cy.contains('Países em Destaque').parents('.card').find('a').click();
    cy.url().should('include', 'intro.html');
  });

  it('Card "Todos os Países" deve ter link funcional', () => {
    cy.contains('Todos os Países').parents('.card').find('a').first().click();
    cy.url().should('include', 'places.html');
  });
});

// 4. TESTE DE BUSCA GLOBAL
describe('Funcionalidade de Busca', () => {
  it('Busca por país deve funcionar no header', () => {
    cy.visit('/');
    cy.get('#global-search-input').type('Brazil');
    cy.get('#search-button').click();
    cy.url().should('include', 'places.html');
    cy.url().should('include', 'search=');
  });

  it('Busca com Enter deve funcionar', () => {
    cy.visit('/');
    cy.get('#global-search-input').type('Japan{enter}');
    cy.url().should('include', 'places.html');
  });

  it('Busca na página de países deve filtrar resultados', () => {
    cy.visit('/places.html');
    cy.wait(2000); // Aguarda carregar países
    cy.get('#search-country-input').type('Braz');
    cy.wait(500);
    // Verifica se há cards visíveis após filtro
    cy.get('.country-card').should('exist');
  });
});

// 5. TESTE DE FILTROS POR CONTINENTE
describe('Filtros por Continente na Página de Países', () => {
  beforeEach(() => {
    cy.visit('/places.html');
    cy.wait(2000); // Aguarda carregamento da API
  });

  it('Deve filtrar países da África', () => {
    cy.get('#continent-filter').select('africa');
    cy.wait(1000);
    cy.get('.country-card').should('exist');
  });

  it('Deve filtrar países das Américas', () => {
    cy.get('#continent-filter').select('americas');
    cy.wait(1000);
    cy.get('.country-card').should('exist');
  });

  it('Deve filtrar países da Ásia', () => {
    cy.get('#continent-filter').select('asia');
    cy.wait(1000);
    cy.get('.country-card').should('exist');
  });

  it('Deve filtrar países da Europa', () => {
    cy.get('#continent-filter').select('europe');
    cy.wait(1000);
    cy.get('.country-card').should('exist');
  });

  it('Deve filtrar países da Oceania', () => {
    cy.get('#continent-filter').select('oceania');
    cy.wait(1000);
    cy.get('.country-card').should('exist');
  });

  it('Deve mostrar todos os países ao selecionar "Todos"', () => {
    cy.get('#continent-filter').select('');
    cy.wait(1000);
    cy.get('.country-card').should('have.length.greaterThan', 10);
  });
});

// 6. TESTE DE CARREGAMENTO DE IMAGENS
describe('Carregamento de Imagens', () => {
  it('Deve carregar todas as imagens da página inicial', () => {
    cy.visit('/');
    cy.wait(2000);
    cy.get('img').each(($img) => {
      // Ignora imagens de erro ou placeholder
      if (!$img.attr('src')?.includes('placeholder')) {
        cy.wrap($img)
          .should('be.visible')
          .and(($el) => {
            expect($el[0].naturalWidth).to.be.greaterThan(0);
          });
      }
    });
  });

  it('Logo deve carregar corretamente', () => {
    cy.visit('/');
    cy.get('img[alt="Logo NoMap"]')
      .should('be.visible')
      .and('have.prop', 'naturalWidth')
      .and('be.greaterThan', 0);
  });
});

// 7. TESTE DE PERFORMANCE
describe('Performance e Tempo de Carregamento', () => {
  it('Página inicial deve carregar em tempo hábil', () => {
    const start = Date.now();
    cy.visit('/').then(() => {
      const loadTime = Date.now() - start;
      expect(loadTime).to.be.lessThan(5000); // máximo 5 segundos
    });
  });

  it('Navegação entre páginas deve ser rápida', () => {
    cy.visit('/');
    const start = Date.now();
    cy.get('#navigationDropdown').click();
    cy.contains('Todos os Países').click().then(() => {
      const navTime = Date.now() - start;
      expect(navTime).to.be.lessThan(3000);
    });
  });

  it('Carregamento de dados da API deve ser eficiente', () => {
    const start = Date.now();
    cy.visit('/places.html');
    cy.get('.country-card').should('exist').then(() => {
      const apiTime = Date.now() - start;
      expect(apiTime).to.be.lessThan(8000); // API externa pode demorar
    });
  });
});

// 8. TESTE DE URLS E REDIRECIONAMENTOS
describe('URLs e Redirecionamentos', () => {
  it('URL deve estar limpa sem parâmetros estranhos', () => {
    cy.visit('/');
    cy.url().should('not.contain', 'undefined');
    cy.url().should('not.contain', 'null');
    cy.url().should('not.contain', '[object');
  });

  it('Navegação deve preservar o protocolo correto', () => {
    cy.visit('/');
    cy.url().should('match', /^https?:\/\//);
  });

  it('Botão voltar do navegador deve funcionar', () => {
    cy.visit('/');
    cy.get('#navigationDropdown').click();
    cy.contains('Todos os Países').click();
    cy.url().should('include', 'places.html');
    cy.go('back');
    cy.url().should('not.include', 'places.html');
  });
});

// 9. TESTE DE MODAL DE CONFIGURAÇÕES
describe('Modal de Configurações', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('Deve abrir o modal de configurações', () => {
    cy.get('#configButton').click();
    cy.get('#configModal').should('be.visible');
  });

  it('Deve fechar o modal ao clicar em Cancelar', () => {
    cy.get('#configButton').click();
    cy.contains('Cancelar').click();
    cy.get('#configModal').should('not.be.visible');
  });

  it('Deve alternar modo escuro', () => {
    cy.get('#configButton').click();
    cy.get('#darkModeToggle').check();
    cy.get('body').should('have.class', 'dark-theme');
    cy.get('#darkModeToggle').uncheck();
    cy.get('body').should('not.have.class', 'dark-theme');
  });

  it('Deve alterar o idioma', () => {
    cy.get('#configButton').click();
    cy.get('#languageSelect').select('en');
    cy.wait(1000);
    // Verifica se algum texto mudou para inglês
    cy.contains('English').should('exist');
  });
});

// 10. TESTE DE LOCAL STORAGE E COOKIES
describe('Armazenamento Local', () => {
  it('Deve salvar preferências no localStorage', () => {
    cy.visit('/');
    cy.get('#configButton').click();
    cy.get('#darkModeToggle').check();
    cy.contains('Salvar Configurações').click();
    cy.wait(500);
    
    cy.window().then((win) => {
      const settings = win.localStorage.getItem('nomap-settings');
      expect(settings).to.exist;
    });
  });

  it('Deve restaurar preferências salvas', () => {
    cy.visit('/');
    cy.get('#configButton').click();
    cy.get('#darkModeToggle').check();
    cy.contains('Salvar Configurações').click();
    cy.wait(500);
    cy.reload();
    cy.get('body').should('have.class', 'dark-theme');
  });
});

// 11. TESTE DE CONSOLE ERRORS
describe('Erros no Console', () => {
  it('Não deve ter erros críticos no console', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        cy.stub(win.console, 'error').as('consoleError');
      }
    });
    cy.wait(3000);
    cy.get('@consoleError').then((errors) => {
      // Permite warnings mas não erros críticos
      const criticalErrors = errors.getCalls().filter(call => 
        !call.args[0].includes('Warning')
      );
      expect(criticalErrors.length).to.be.lessThan(3);
    });
  });
});

// 12. TESTE DE DETALHES DO PAÍS
describe('Página de Detalhes do País', () => {
  it('Deve carregar detalhes ao clicar em um país', () => {
    cy.visit('/places.html');
    cy.wait(3000);
    cy.get('.country-card').first().find('a').click();
    cy.url().should('include', 'country.html');
    cy.url().should('include', 'code=');
  });

  it('Página de detalhes deve exibir informações do país', () => {
    cy.visit('/country.html?code=BRA');
    cy.wait(3000);
    cy.get('h1').should('be.visible');
    cy.contains('Capital').should('be.visible');
    cy.contains('População').should('be.visible');
  });
});

// 13. TESTE DE RESPONSIVIDADE
describe('Responsividade', () => {
  const viewports = ['iphone-6', 'ipad-2', [1920, 1080]];

  viewports.forEach((viewport) => {
    it(`Deve ser responsivo em ${viewport}`, () => {
      if (Array.isArray(viewport)) {
        cy.viewport(viewport[0], viewport[1]);
      } else {
        cy.viewport(viewport);
      }
      cy.visit('/');
      cy.get('header').should('be.visible');
      cy.get('main').should('be.visible');
    });
  });
});