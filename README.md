# ProjetoViagen# 🌍 NoMap - Seu Guia de Viagens Sem Fronteiras

**Versão do Documento:** 1.0  
**Data de Criação:** 12/09/2025  

---

## 📌 Visão Geral

O **NoMap** é uma plataforma web de guia de viagens que centraliza informações detalhadas sobre países ao redor do mundo. O projeto utiliza APIs públicas para fornecer dados atualizados sobre clima, imagens, informações geográficas e culturais, criando uma experiência única e informativa para viajantes e entusiastas de geografia.

### 🎯 Objetivo Principal
Criar um site intuitivo e visualmente atraente que permita aos usuários explorar informações completas sobre qualquer país do mundo, facilitando o planejamento de viagens e a descoberta de novos destinos.

### 👥 Público-Alvo
- Viajantes e turistas
- Estudantes e pesquisadores
- Curiosos por diferentes culturas
- Profissionais do turismo

---

## ✅ Funcionalidades Atuais

### 🌐 Sistema de Navegação
- Header com logo e busca global
- Navegação entre páginas
- Footer com direitos autorais

### 🏠 Página Inicial (`index.html`)
- Apresentação da marca
- Cards para seções principais
- Seção "Sobre o NoMap"

### 🗺️ Página de Todos os Países (`places.html`)
- Grid de países com:
  - Filtro por continente
  - Busca em tempo real
  - Ordenação alfabética
  - Bandeira, capital, população, idioma, moeda

### 📄 Página de Detalhes do País (`country.html`)
- Informações completas do país
- Clima atual via OpenWeatherMap API
- Imagem do país via Unsplash API
- Dados de capital, população, moeda, idioma, fuso horário

### 📚 Páginas Institucionais
- `about.html` – Quem Somos  
- `mission.html` – Missão e Visão  
- `intro.html` – Placeholder para Países em Destaque

---

## 🛠️ Funcionalidades a Implementar

### Alta Prioridade
- [ ] Sistema de favoritos
- [ ] Comparação entre países
- [ ] Informações sobre vistos/documentos
- [ ] Conversão de moedas em tempo real
- [ ] Mapa interativo na página de detalhes

### Média Prioridade
- [ ] Comentários e avaliações
- [ ] Galeria de fotos
- [ ] Informações sobre pontos turísticos
- [ ] Dicas de viagem
- [ ] Histórico de visualizações

### Baixa Prioridade
- [ ] Login/Cadastro de usuários
- [ ] Roteiros personalizados
- [ ] Blog de viagens
- [ ] Integração com redes sociais
- [ ] Versão mobile app (PWA)

---

## 🧰 Tecnologias Utilizadas

### Front-End
- HTML5, CSS3
- **Bootstrap 5.3.3**
- JavaScript Vanilla

### APIs Integradas
- [REST Countries API](https://restcountries.com/)
- [OpenWeatherMap API](https://openweathermap.org/api)
- [Unsplash API](https://unsplash.com/developers)

---

## 🗂️ Estrutura do Projeto

├── index.html
├── places.html
├── country.html
├── intro.html
├── about.html
├── mission.html
├── css/
│ └── style.css
├── js/
│ └── app.js
└── assets/
└── logo.png

---

## 📐 Padrões e Boas Práticas

### 🔄 Performance
- Busca com debounce (300ms)
- Ordenação com `Intl.Collator`
- Lazy loading planejado
- Cache de dados para reduzir requisições

### ♿ Acessibilidade
- Atributos ARIA
- Imagens com alt text
- Navegação por teclado
- Contraste adequado

### 📱 Responsividade
- Design mobile-first
- Grid flexível via Bootstrap
- Imagens adaptáveis

---

## 📆 Cronograma de Desenvolvimento

### Fase 1 – MVP ✅
- Estrutura básica
- Integrações com APIs
- Páginas principais

### Fase 2 – Melhorias 🔄 *(4 semanas)*
- Performance e UX
- Favoritos
- Correções e testes

### Fase 3 – Expansão 📅 *(6–8 semanas)*
- Funcionalidades de usuário
- Conteúdo adicional
- Versão mobile otimizada

### Fase 4 – Lançamento 🚀 *(2–3 semanas)*
- Deploy final
- Monitoramento
- Estratégia de marketing

---

## 🔒 Requisitos e Segurança

### Técnicos
- Navegadores modernos (Chrome 90+, Firefox 88+, Safari 14+)
- JavaScript habilitado
- Resolução mínima: 320px

### Restrições
- Limites de requisição das APIs (ver abaixo)

### Segurança
- Evitar exposição de chaves de API no front
- Implementar HTTPS
- Validação de inputs e proteção XSS

---

## 📊 Métricas de Sucesso

### Técnicas
- ⏱️ Carregamento < 3s  
- ❌ Erros < 1%  
- ✅ Disponibilidade > 99%  
- ♿ Acessibilidade > 90 (Lighthouse)

### Negócio
- 👥 1000+ usuários/mês no 1º ano  
- 🔁 Taxa de retorno > 40%  
- ⏳ Tempo médio > 5 min  
- 🌟 NPS > 70

---

## ⚠️ Riscos e Mitigações

| Risco                     | Mitigação                            |
|--------------------------|--------------------------------------|
| Limite de APIs excedido  | Cache e rate limiting                |
| APIs descontinuadas      | Ter alternativas                     |
| Performance mobile       | Lazy loading e otimizações           |
| Dados desatualizados     | Atualização periódica                |

---

## ⏭️ Próximos Passos

### Imediatos (2 semanas)
- Finalizar página “Países em Destaque”
- Implementar cache local
- Expandir informações por país
- Refinar design visual

### Curto Prazo (1 mês)
- Desenvolver sistema de favoritos
- Testes automatizados
- Documentação das APIs
- Ambiente de staging

### Médio Prazo (3 meses)
- Versão beta pública
- Coleta e análise de feedback
- Melhorias baseadas em uso real
- Estratégia de lançamento

---

## 📄 Documentação

- `README.md` – Instruções do projeto  
- Documentação das APIs utilizadas  
- Guia de contribuição  
- Changelog de versões  

---

## ☁️ Recursos Necessários

- Hospedagem (Netlify, Vercel, AWS)
- Domínio personalizado
- Certificado SSL
- Planos pagos de APIs (conforme crescimento)

---

## 📬 Contato e Suporte

**Equipe de Desenvolvimento:**
- Guilherme Dalosto – Desenvolvedor Sênior  
- Felipe de Lima – Desenvolvedor Júnior  
- Bruno Silva – Testador  

---

*Este documento será atualizado conforme o progresso do projeto.*  
📅 **Última atualização:** 12/09/2025
