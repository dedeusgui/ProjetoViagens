# 🌍 NoMap

> Uma plataforma web intuitiva para exploração de países e destinos ao redor do mundo

[![Licença](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Status do Projeto](https://img.shields.io/badge/status-ativo-green.svg)]()
[![Versão](https://img.shields.io/badge/versão-0.0.5-brightgreen.svg)]()

## 📖 Sobre o Projeto

**NoMap** é uma aplicação web moderna que centraliza informações sobre países de todo o mundo, oferecendo uma experiência rica e interativa para viajantes, estudantes e entusiastas de geografia. Com design responsivo e dados atualizados em tempo real, a plataforma democratiza o acesso à informação sobre destinos globais.

### 🎯 Objetivos
- Centralizar informações confiáveis sobre países em uma única plataforma
- Oferecer interface moderna e acessível para todos os usuários  
- Conectar pessoas a destinos através de dados relevantes e atualizados
- Inspirar o planejamento de viagens com informações completas

## ✨ Funcionalidades

### 🔍 Exploração Inteligente
- **Busca Global**: Sistema de pesquisa rápida integrada
- **Filtros por Região**: Navegação organizada por continentes
- **Países em Destaque**: Coleção curada dos melhores destinos
- **Busca em Tempo Real**: Resultados instantâneos com debounce otimizado

### 📊 Informações Completas
- **Dados Geográficos**: Capital, população, área territorial
- **Informações Culturais**: Idiomas, moedas e etnias
- **Clima Atual**: Temperatura e condições meteorológicas em tempo real
- **Recursos Visuais**: Bandeiras oficiais e imagens inspiradoras

### 🎨 Interface Moderna
- **Design Responsivo**: Experiência otimizada em todos os dispositivos
- **Animações Fluidas**: Transições suaves e interações elegantes
- **Acessibilidade**: Conformidade com padrões WCAG
- **Performance**: Carregamento rápido com lazy loading

## 🛠️ Tecnologias

### Frontend
- **HTML5** - Estrutura semântica
- **CSS3** - Estilização moderna com Flexbox/Grid
- **JavaScript ES6+** - Funcionalidades interativas
- **Bootstrap 5.3** - Framework responsivo

### APIs Integradas
- **[REST Countries API](https://restcountries.com/)** - Dados geográficos e culturais
- **[OpenWeatherMap](https://openweathermap.org/api)** - Informações climáticas
- **[Unsplash API](https://unsplash.com/developers)** - Imagens de alta qualidade

## 🚀 Como Executar

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/nomap.git
cd nomap
```

### 2. Configure as chaves de API
Edite o arquivo `js/app.js`:
```javascript
const weatherKey = "SUA_CHAVE_OPENWEATHERMAP";
const unplashKey = "SUA_CHAVE_UNSPLASH";
```

### 3. Execute um servidor local
```bash
# Com Python 3
python -m http.server 8000

# Com Node.js
npx http-server -p 8000

# Com PHP
php -S localhost:8000
```

### 4. Acesse a aplicação
Abra seu navegador em `http://localhost:8000`

## 📁 Estrutura do Projeto

```
nomap/
├── 📄 index.html          # Página inicial
├── 📄 places.html         # Lista de países
├── 📄 country.html        # Detalhes do país
├── 📄 intro.html          # Países em destaque
├── 📄 about.html          # Sobre a equipe
├── 📄 mission.html        # Nossa missão
├── 📁 css/
│   └── 🎨 style.css       # Estilos principais
├── 📁 js/
│   └── ⚙️ app.js          # Lógica da aplicação
├── 📁 assets/
│   ├── 🖼️ logo.png        # Logo do projeto
│   └── 🖼️ banner.jpg      # Imagem principal
└── 📋 README.md           # Este arquivo
```

## 🔧 Configuração das APIs

### OpenWeatherMap
1. Acesse [openweathermap.org/api](https://openweathermap.org/api)
2. Crie uma conta gratuita
3. Obtenha sua API key
4. Configure no arquivo `js/app.js`

### Unsplash
1. Acesse [unsplash.com/developers](https://unsplash.com/developers)
2. Registre uma nova aplicação
3. Copie o Access Key
4. Configure no arquivo `js/app.js`

## 🎯 Páginas da Aplicação

| Página | Descrição |
|--------|-----------|
| **Home** | Página inicial com navegação e apresentação |
| **Explorar** | Grid completo de todos os países com filtros |
| **Destaques** | Países selecionados com informações detalhadas |
| **Detalhes** | Página individual com dados completos do país |
| **Sobre** | Apresentação da equipe e filosofia do projeto |
| **Missão** | Objetivos e valores fundamentais |

## 🤝 Como Contribuir

1. **Fork** este repositório
2. **Crie** uma branch: `git checkout -b minha-feature`
3. **Commit** suas alterações: `git commit -m 'Adiciona nova feature'`
4. **Push** para a branch: `git push origin minha-feature`
5. **Abra** um Pull Request

### 📋 Guidelines
- Mantenha o código limpo e bem documentado
- Teste em diferentes dispositivos e navegadores
- Siga os padrões de codificação existentes
- Atualize a documentação quando necessário

## 👥 Equipe

<table>
  <tr>
    <td align="center">
      <img src="https://via.placeholder.com/100x100" width="100px;" alt="Bruno"/>
      <br />
      <sub><b>Bruno</b></sub>
      <br />
      <sub>🧪 Quality Assurance</sub>
    </td>
    <td align="center">
      <img src="https://via.placeholder.com/100x100" width="100px;" alt="Guilherme"/>
      <br />
      <sub><b>Guilherme</b></sub>
      <br />
      <sub>👨‍💻 Desenvolvedor Sênior</sub>
    </td>
    <td align="center">
      <img src="https://via.placeholder.com/100x100" width="100px;" alt="Felipe"/>
      <br />
      <sub><b>Felipe</b></sub>
      <br />
      <sub>💻 Desenvolvedor Júnior</sub>
    </td>
  </tr>
</table>

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🌟 Reconhecimentos

- **REST Countries** pela API gratuita de dados geográficos
- **OpenWeatherMap** pelas informações meteorológicas
- **Unsplash** pelas imagens de alta qualidade
- **Bootstrap** pelo framework CSS robusto

---

<div align="center">
  <p><strong>NoMap - Descubra o mundo sem fronteiras 🌍</strong></p>
  <p>Desenvolvido com ❤️ pela equipe NoMap</p>

</div>
