# NoMap

**NoMap** é uma plataforma web moderna e intuitiva para exploração de países e destinos ao redor do mundo. Desenvolvida com foco na experiência do usuário, a aplicação oferece informações completas sobre países, incluindo dados geográficos, climáticos e culturais.

## Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [APIs Utilizadas](#apis-utilizadas)
- [Instalação e Configuração](#instalação-e-configuração)
- [Como Executar](#como-executar)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Páginas Disponíveis](#páginas-disponíveis)
- [Contribuição](#contribuição)
- [Licença](#licença)
- [Equipe](#equipe)

## Sobre o Projeto

O NoMap nasceu da necessidade de centralizar informações de viagem em uma única plataforma. Nossa missão é tornar a descoberta de novos destinos mais simples, inspiradora e acessível para todos os viajantes.

### Objetivos
- Democratizar o acesso à informação de viagem
- Oferecer dados atualizados e confiáveis sobre países
- Criar uma experiência de usuário moderna e responsiva
- Conectar viajantes a destinos de forma autêntica

### Público-Alvo
- Viajantes e turistas
- Estudantes e pesquisadores
- Curiosos por diferentes culturas
- Profissionais do turismo

## Funcionalidades

### Exploração de Países
- **Busca Global**: Sistema de busca integrado no header
- **Filtros por Continente**: África, Américas, Ásia, Europa, Oceania
- **Busca por Nome**: Pesquisa em tempo real com debounce
- **Países em Destaque**: Seleção curada dos melhores destinos

### Informações Detalhadas
- **Dados Geográficos**: Capital, população, região, sub-região
- **Informações Culturais**: Idiomas oficiais, moedas
- **Clima em Tempo Real**: Temperatura atual e condições meteorológicas
- **Bandeiras**: Visualização das bandeiras oficiais
- **Imagens**: Fotos inspiradoras dos destinos via Unsplash

### Interface Moderna
- **Design Responsivo**: Otimizado para desktop, tablet e mobile
- **Animações Suaves**: Transições e efeitos visuais elegantes
- **Acessibilidade**: Conformidade com padrões de acessibilidade web
- **Performance**: Carregamento otimizado e lazy loading

## Tecnologias Utilizadas

### Frontend
- **HTML5**: Estrutura semântica e acessível
- **CSS3**: Estilização moderna com variáveis CSS e Flexbox/Grid
- **JavaScript ES6+**: Lógica de aplicação com features modernas
- **Bootstrap 5.3.3**: Framework CSS para responsividade

### Bibliotecas e Frameworks
- **Font Awesome 6.0.0**: Ícones vetoriais
- **Bootstrap Icons**: Ícones complementares
- **Intl API**: Formatação de números e datas

### APIs Externas
- **REST Countries API**: Dados completos sobre países
- **OpenWeatherMap API**: Informações meteorológicas
- **Unsplash API**: Imagens de alta qualidade dos destinos

## APIs Utilizadas

### REST Countries API
- **URL Base**: `https://restcountries.com/v3.1`
- **Uso**: Dados geográficos, populacionais e culturais
- **Endpoints Principais**:
  - `/all` - Todos os países
  - `/name/{name}` - Busca por nome
  - `/region/{region}` - Países por região

### OpenWeatherMap API
- **URL Base**: `https://api.openweathermap.org/data/2.5`
- **Uso**: Dados meteorológicos em tempo real
- **Endpoint**: `/weather` - Clima atual por coordenadas

### Unsplash API
- **URL Base**: `https://api.unsplash.com`
- **Uso**: Imagens inspiradoras dos destinos
- **Endpoint**: `/search/photos` - Busca de fotos por termo

## Instalação e Configuração

### Pré-requisitos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Servidor web local (opcional, mas recomendado)
- Chaves de API (ver configuração abaixo)

### Clone o Repositório
```bash
git clone https://github.com/seu-usuario/nomap.git
cd nomap
```

### Configuração das APIs
No arquivo `js/app.js`, configure suas chaves de API:

```javascript
const weatherKey = "SUA_CHAVE_OPENWEATHERMAP";
const unplashKey = "SUA_CHAVE_UNSPLASH";
```

#### Obtendo as Chaves de API

**OpenWeatherMap:**
1. Acesse [OpenWeatherMap](https://openweathermap.org/api)
2. Crie uma conta gratuita
3. Gere sua API key no dashboard
4. Substitua em `weatherKey`

**Unsplash:**
1. Acesse [Unsplash Developers](https://unsplash.com/developers)
2. Crie uma aplicação
3. Copie o Access Key
4. Substitua em `unplashKey`

## Como Executar

### Opção 1: Servidor HTTP Simples (Recomendado)

**Com Python:**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Com Node.js (http-server):**
```bash
npx http-server -p 8000
```

**Com PHP:**
```bash
php -S localhost:8000
```

Acesse: `http://localhost:8000`

### Opção 2: Abrir Diretamente no Navegador
Devido às políticas CORS das APIs, esta opção pode apresentar limitações. Use um servidor local sempre que possível.

## Estrutura do Projeto

```
nomap/
├── index.html              # Página inicial
├── about.html              # Sobre nós
├── country.html            # Detalhes do país
├── intro.html              # Países em destaque
├── mission.html            # Nossa missão
├── places.html             # Todos os países
├── css/
│   └── style.css           # Estilos principais
├── js/
│   └── app.js              # Lógica da aplicação
├── assets/
│   ├── logo.png            # Logo do projeto
│   └── banner.jpg          # Imagem hero
└── README.md               # Documentação
```

## Páginas Disponíveis

### index.html - Página Inicial
- Hero section com call-to-action
- Cards de navegação
- Seções informativas sobre o projeto

### places.html - Explorar Países
- Grid com todos os países
- Sistema de busca e filtros
- Cards informativos com dados essenciais

### intro.html - Países em Destaque
- Seleção curada de destinos populares
- Cards expandidos com mais informações
- Dados climáticos em tempo real

### country.html - Detalhes do País
- Informações completas do destino
- Dados geográficos e climáticos
- Galeria de imagens
- Bandeira oficial

### about.html - Quem Somos
- História da equipe
- Filosofia do projeto
- Apresentação dos membros

### mission.html - Nossa Missão
- Visão e objetivos
- Valores fundamentais
- Planos futuros

## Funcionalidades Técnicas

### Performance
- **Debounce**: Busca otimizada com atraso de 300ms
- **Lazy Loading**: Carregamento sob demanda
- **Cache**: Armazenamento em memória dos dados
- **Compressão**: Imagens otimizadas

### Acessibilidade
- **ARIA Labels**: Labels descritivos para screen readers
- **Navegação por Teclado**: Suporte completo
- **Contraste**: Cores com contraste adequado
- **Semântica**: HTML estruturado semanticamente

### Responsividade
- **Mobile First**: Design otimizado para dispositivos móveis
- **Breakpoints**: Adaptação para diferentes tamanhos de tela
- **Touch Friendly**: Elementos tocáveis adequados

## Contribuição

Contribuições são sempre bem-vindas! Para contribuir:

1. **Fork** o projeto
2. **Crie** uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. **Abra** um Pull Request

### Guidelines de Contribuição
- Mantenha o código limpo e documentado
- Siga os padrões de codificação existentes
- Teste suas alterações em diferentes dispositivos
- Atualize a documentação quando necessário

## Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## Equipe

### Bruno - Testador
- Guardião da qualidade e experiência do usuário
- Acredita que um produto excelente nasce da atenção aos detalhes

### Guilherme - Desenvolvedor Sênior
- Arquiteto da solução e mentor da equipe
- Transforma desafios complexos em código elegante e eficiente

### Felipe - Desenvolvedor Júnior
- Entusiasta da tecnologia e implementador de soluções
- Acredita que cada linha de código contribui para uma experiência melhor

---

## Suporte e Contato

- **Issues**: [GitHub Issues](https://github.com/seu-usuario/nomap/issues)
- **Website**: [NoMap](https://seu-usuario.github.io/nomap)

---

**NoMap** - *Descubra o mundo sem fronteiras*

---

*Desenvolvido com amor pela equipe NoMap*
