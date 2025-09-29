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

