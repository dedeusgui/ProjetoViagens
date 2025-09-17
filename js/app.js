const weatherKey = "c26c5146c2c101254e53b49b3e12e8d6";
const unplashKey = "qEI-_nCL8zMTZvEMz-iRMgluWKn1uxM_8yS0s_l7NLg";
const restCountriesLink = "https://restcountries.com/v3.1";

// A base de dados principal para todos os países
let allCountriesData = [];

// Collator reutilizável (mais performático que localeCompare quando usado repetidamente)
const collator = new Intl.Collator("pt-BR", {
  sensitivity: "base", // ignora maiúsculas/minúsculas
  ignorePunctuation: true, // ignora pontuação
});

// Seleciona os elementos do HTML
const countriesGrid = document.getElementById("countries-grid");
const continentFilter = document.getElementById("continent-filter");
const searchCountryInput = document.getElementById("search-country-input");
const globalSearchInput = document.getElementById("global-search-input");
const searchButton = document.getElementById("search-button");

/**
 * Função utilitária para 'debounce'.
 * @param {function} func - A função que será executada após o tempo de espera.
 * @param {number} delay - O tempo de espera em milissegundos.
 */
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

/**
 * Função genérica para conectar a qualquer API.
 * @param {string} url - O URL do endpoint da API.
 * @returns {Promise<any>} - Retorna um objeto JSON com os dados da API.
 */
async function fetchAPI(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Erro na requisição: ${response.status} ${response.statusText}`
      );
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Falha na conexão com a API:", error);
    throw error;
  }
}

/**
 * Extrai dados complexos da API de forma segura.
 * @param {object} obj - O objeto do país vindo da API.
 * @param {string} type - 'currency' ou 'language'.
 * @returns {string} - Retorna o nome da moeda/idioma ou 'N/A'.
 */
function getComplexData(obj, type) {
  if (!obj || typeof obj !== "object") {
    return "N/A";
  }

  try {
    const values = Object.values(obj);
    if (values && values.length > 0) {
      if (type === "currency") {
        // Tenta pegar o nome da moeda de diferentes formas
        const firstCurrency = values[0];
        if (firstCurrency && firstCurrency.name) {
          return firstCurrency.name;
        } else if (firstCurrency && typeof firstCurrency === "string") {
          return firstCurrency;
        }
        return "N/A";
      } else if (type === "language") {
        // Para idiomas, pega o primeiro valor
        const firstLanguage = values[0];
        if (typeof firstLanguage === "string") {
          return firstLanguage;
        } else if (firstLanguage && firstLanguage.name) {
          return firstLanguage.name;
        }
        return "N/A";
      }
    }
    return "N/A";
  } catch (e) {
    console.warn(`Erro ao processar dados de ${type}:`, e);
    return "N/A";
  }
}
/**
 * Ordena um array de países in-place usando o collator global.
 * @param {Array} array - array de países (modificado in-place).
 */
function sortCountriesInPlace(array) {
  if (!Array.isArray(array) || array.length === 0) return;
  array.sort((a, b) =>
    collator.compare(a?.name?.common ?? "", b?.name?.common ?? "")
  );
}

/**
 * Função principal para buscar todos os países da API.
 */
async function getAllCountries() {
  if (!countriesGrid) {
    return;
  }
  // acessibilidade: indica que a região está ocupada
  countriesGrid.setAttribute("aria-busy", "true");

  try {
    countriesGrid.innerHTML =
      '<div class="text-center w-100"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Carregando...</span></div></div>';

    const url =
      "https://restcountries.com/v3.1/all?fields=name,flags,capital,population,continents,languages,currencies";
    const data = await fetchAPI(url);

    // ordena in-place para máxima performance e evita cópias desnecessárias
    sortCountriesInPlace(data);

    // guarda no seu array global já ordenado
    allCountriesData = data;

    // exibe (agora já ordenado)
    displayCountriesGrid(allCountriesData);
  } catch (error) {
    console.error("Ocorreu um erro ao buscar os países:", error);
    countriesGrid.innerHTML = `<div class="alert alert-danger w-100" role="alert">Não foi possível carregar os países. Por favor, tente novamente mais tarde.</div>`;
  } finally {
    countriesGrid.setAttribute("aria-busy", "false");
  }
}

/**
 * Função para buscar países de uma região específica.
 * @param {string} region - O nome da região (por exemplo, 'americas').
 */
async function getCountriesByRegion(region) {
  if (!countriesGrid) return;
  countriesGrid.setAttribute("aria-busy", "true");

  try {
    countriesGrid.innerHTML =
      '<div class="text-center w-100"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Carregando...</span></div></div>';
    const url = `https://restcountries.com/v3.1/region/${region}?fields=name,flags,capital,population,continents,languages,currencies`;
    const data = await fetchAPI(url);

    // ordena in-place e guarda
    sortCountriesInPlace(data);
    allCountriesData = data;

    displayCountriesGrid(data);
  } catch (error) {
    console.error("Ocorreu um erro ao buscar por região:", error);
    countriesGrid.innerHTML = `<div class="alert alert-danger w-100" role="alert">Não foi possível carregar os países do continente.</div>`;
  } finally {
    countriesGrid.setAttribute("aria-busy", "false");
  }
}

/**
 * Função para criar e exibir os cards dos países no grid.
 * @param {Array} countries - Array de objetos com dados de países.
 */
function displayCountriesGrid(countries) {
  if (!countriesGrid) {
    console.error("Elemento countries-grid não encontrado");
    return;
  }

  countriesGrid.innerHTML = "";

  if (!countries || countries.length === 0) {
    countriesGrid.innerHTML = `
      <div class="col-12">
        <div class="alert alert-info text-center" role="alert">
          <i class="fas fa-search me-2"></i>Nenhum país encontrado.
        </div>
      </div>`;
    return;
  }

  const html = countries
    .map((country) => {
      try {
        const population = country.population
          ? new Intl.NumberFormat("pt-BR").format(country.population)
          : "N/A";
        const currency = getComplexData(country.currencies, "currency");
        const language = getComplexData(country.languages, "language");
        const continent =
          country.continents && country.continents.length > 0
            ? country.continents[0]
            : "N/A";
        const capital =
          country.capital && country.capital.length > 0
            ? country.capital[0]
            : "N/A";
        const flagUrl =
          country.flags && country.flags.svg
            ? country.flags.svg
            : country.flags?.png ||
              "https://via.placeholder.com/300x200?text=Bandeira";
        const countryName = country.name?.common || "País desconhecido";

        return `
        <div class="col">
          <div class="card country-card h-100 shadow-sm border-0 card-hover-lift card-hover-border">
            <!-- Bandeira maior sem overlay -->
            <div class="position-relative">
              <img src="${flagUrl}" 
                   class="country-flag-img" 
                   alt="Bandeira de ${countryName}"
                   onerror="this.src='https://via.placeholder.com/300x200?text=Bandeira'">
              <!-- Badge do continente visível -->
              <div class="country-badge-container">
                <span class="country-badge">${continent}</span>
              </div>
            </div>
            
            <div class="card-body">
              <h5 class="card-title fw-bold text-primary">${countryName}</h5>
              
              <div class="country-info-grid">
                <div class="info-item">
                  <small>Capital</small>
                  <p class="mb-0">${capital}</p>
                </div>
                <div class="info-item">
                  <small>População</small>
                  <p class="mb-0">${population}</p>
                </div>
                <div class="info-item">
                  <small>Idioma</small>
                  <p class="mb-0 text-truncate" title="${language}">${language}</p>
                </div>
                <div class="info-item">
                  <small>Moeda</small>
                  <p class="mb-0 text-truncate" title="${currency}">${currency}</p>
                </div>
              </div>
              
              <a href="country.html?name=${encodeURIComponent(countryName)}" 
                 class="btn btn-primary w-100 btn-hover-shadow">
                <i class="fas fa-map-marker-alt me-2"></i>Explorar
              </a>
            </div>
          </div>
        </div>
      `;
      } catch (error) {
        console.error("Erro ao processar país:", country, error);
        return ""; // Retorna string vazia se houver erro
      }
    })
    .filter((html) => html !== "") // Remove entradas vazias
    .join("");

  if (html) {
    countriesGrid.innerHTML = html;
  } else {
    countriesGrid.innerHTML = `
      <div class="col-12">
        <div class="alert alert-warning text-center" role="alert">
          <i class="fas fa-exclamation-triangle me-2"></i>Erro ao carregar os países. Tente novamente.
        </div>
      </div>`;
  }
}

/**
 * Função que filtra e exibe os países com base no texto de busca.
 * @param {string} searchTerm - Termo de busca opcional
 */
/**
 * Função que filtra e exibe os países com base no texto de busca.
 * @param {string} searchTerm - Termo de busca opcional
 */
async function searchCountries(searchTerm = null) {
  // Se dados não carregados, carrega primeiro
  if (allCountriesData.length === 0) {
    await getAllCountries();
    // Se após carregar ainda não há dados, sai
    if (allCountriesData.length === 0) {
      return;
    }
  }

  // Pega o elemento do título uma vez
  const countriesTitle = document.getElementById("countries-title");

  // Usa o termo passado como parâmetro ou pega do input local
  const formatedSearch = (
    searchTerm || (searchCountryInput ? searchCountryInput.value : "")
  )
    .toLowerCase()
    .trim();

  // Se não há termo de busca, limpa o título e mostra todos os países
  if (formatedSearch === "") {
    if (countriesTitle) {
      countriesTitle.textContent = ""; // Limpa o título aqui
    }
    displayCountriesGrid(allCountriesData);
    return;
  }

  // Se chegou aqui, é porque há um termo de busca. Prossegue com o filtro.
  const filteredCountries = allCountriesData.filter((country) =>
    country.name.common.toLowerCase().includes(formatedSearch)
  );

  // Atualiza o título com o número de resultados
  if (countriesTitle) {
    if (filteredCountries.length === 0) {
      countriesTitle.textContent = `Nenhum país encontrado para "${
        searchTerm || formatedSearch
      }"`;
    } else {
      countriesTitle.textContent = `${filteredCountries.length} país${
        filteredCountries.length !== 1 ? "es" : ""
      } encontrado${filteredCountries.length !== 1 ? "s" : ""} para "${
        searchTerm || formatedSearch
      }"`;
    }
  }

  // Mostra os resultados filtrados
  displayCountriesGrid(filteredCountries);
}

// Adiciona o ouvinte de evento para o filtro de continente
if (continentFilter) {
  continentFilter.addEventListener("change", () => {
    const selectedContinent = continentFilter.value;
    // Limpa o título quando muda o filtro
    const countriesTitle = document.getElementById("countries-title");
    if (countriesTitle) {
      countriesTitle.textContent = "";
    }

    if (selectedContinent === "Todos") {
      getAllCountries();
    } else {
      getCountriesByRegion(selectedContinent);
    }
  });
}

// Adiciona o ouvinte de evento para a busca local (página places.html)
if (searchCountryInput) {
  const debouncedSearch = debounce(() => searchCountries(), 300);

  // Lógica para executar a busca em tempo real (evento 'input')
  searchCountryInput.addEventListener("input", debouncedSearch);

  // Lógica para executar a busca quando a tecla Enter é pressionada
  searchCountryInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      searchCountries();
    }
  });
}

/**
 * Pega o nome do país da URL (query parameter).
 * @returns {string} - O nome do país.
 */
function getCountryNameFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("name");
}

/**
 * Pega o termo de busca da URL (query parameter).
 * @returns {string} - O termo de busca ou string vazia se não existir.
 */
function getSearchTermFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("search") || "";
}

/**
 * Função de busca global que redireciona para a página de resultados.
 */
function globalSearch() {
  // Pega o valor do input global do header
  const searchTerm = globalSearchInput ? globalSearchInput.value.trim() : "";

  // Se a busca estiver vazia, não faz nada
  if (searchTerm === "") {
    return;
  }

  // Redireciona para places.html com o termo de busca na URL
  window.location.href = `places.html?search=${encodeURIComponent(searchTerm)}`;
}

// Lógica para executar a busca global quando o botão é clicado
if (searchButton && globalSearchInput) {
  searchButton.addEventListener("click", globalSearch);

  // Lógica para executar a busca global quando a tecla Enter é pressionada
  globalSearchInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      event.preventDefault(); // Evita o comportamento padrão
      globalSearch();
    }
  });
}

/**
 * Busca os dados de um país específico por nome na API Rest Countries.
 * @param {string} countryName - O nome do país.
 * @returns {Promise<object>} - Os dados do país.
 */
async function getCountryData(countryName) {
  // URL corrigida - removendo espaços extras
  const url = `https://restcountries.com/v3.1/name/${countryName}?fields=name,capital,population,languages,currencies,latlng,timezones,flags,borders,region,subregion,continents`;

  try {
    const data = await fetchAPI(url);
    // A API retorna um array, então pegamos o primeiro item
    return data[0];
  } catch (error) {
    console.error("Erro ao buscar dados do país:", error);
    return null;
  }
}

/**
 * Busca os dados de clima de um país usando as coordenadas.
 * @param {number} lat - Latitude do país.
 * @param {number} lon - Longitude do país.
 * @returns {Promise<object>} - Os dados de clima.
 */
async function getWeather(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&appid=${weatherKey}`;
  try {
    return await fetchAPI(url);
  } catch (error) {
    console.error("Erro ao buscar dados do clima:", error);
    return null;
  }
}

/**
 * Busca uma imagem de fundo para o país na API Unsplash.
 * @param {string} query - O termo de busca (nome do país).
 * @returns {Promise<string>} - A URL da imagem.
 */
async function getCountryImage(query) {
  const url = `https://api.unsplash.com/search/photos?query=${query}&per_page=1&client_id=${unplashKey}`;
  try {
    const data = await fetchAPI(url);
    return data.results[0].urls.full;
  } catch (error) {
    console.error("Erro ao buscar imagem:", error);
    // Retorna uma imagem de fallback em caso de erro
    return "https://via.placeholder.com/1920x1080?text=NoMap";
  }
}

/**
 * Função principal para a página de detalhes do país.
 */
async function displayCountryDetails() {
  const container = document.getElementById("country-details-container");
  const countryName = getCountryNameFromUrl();

  if (!countryName || !container) {
    return;
  }

  container.innerHTML = `
    <div class="d-flex flex-column align-items-center justify-content-center w-100 p-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Carregando...</span>
      </div>
      <p class="mt-3 text-muted">Descobrindo o destino perfeito...</p>
    </div>
  `;

  try {
    const countryData = await getCountryData(countryName);

    if (!countryData) {
      container.innerHTML = `<div class="alert alert-danger w-100">País não encontrado.</div>`;
      return;
    }

    // Buscar clima e imagem em paralelo
    const [weatherData, imageUrl] = await Promise.all([
      countryData.latlng
        ? getWeather(countryData.latlng[0], countryData.latlng[1])
        : Promise.resolve(null),
      getCountryImage(countryName),
    ]);

    // Processar dados com tratamento melhorado
    const population = countryData.population
      ? new Intl.NumberFormat("pt-BR").format(countryData.population)
      : "N/A";

    const currency = getComplexData(countryData.currencies, "currency");
    const language = getComplexData(countryData.languages, "language");

    const weather = weatherData
      ? `${Math.round(weatherData.main.temp)}°C, ${
          weatherData.weather[0].description
        }`
      : "N/A";

    const timezone =
      countryData.timezones && countryData.timezones.length > 0
        ? countryData.timezones[0]
        : "N/A";

    const capital =
      countryData.capital && countryData.capital.length > 0
        ? countryData.capital[0]
        : "N/A";

    const region = countryData.region || "N/A";
    const subregion = countryData.subregion || "N/A";
    const continent =
      countryData.continents && countryData.continents.length > 0
        ? countryData.continents[0]
        : "N/A";

    const detailsHTML = `
      <div class="row g-4">
        <div class="col-12 mb-4 text-center">
          <h1 class="display-4 fw-bold text-primary">${
            countryData.name.common
          }</h1>
          <p class="lead text-muted">${countryData.name.official}</p>
        </div>

        <div class="col-lg-6 col-md-12 mb-4">
          <div class="card h-100 shadow-sm border-0 rounded-4">
            <div class="card-body p-4">
              <h5 class="fw-bold mb-3"><i class="fas fa-info-circle me-2"></i>Informações do País</h5>
              <ul class="list-unstyled">
                <li class="mb-2"><strong>Continente:</strong> ${continent}</li>
                <li class="mb-2"><strong>Região:</strong> ${region}</li>
                <li class="mb-2"><strong>Sub-região:</strong> ${subregion}</li>
                <li class="mb-2"><strong>Capital:</strong> ${capital}</li>
                <li class="mb-2"><strong>População:</strong> ${population}</li>
                <li class="mb-2"><strong>Idioma:</strong> ${language}</li>
                <li class="mb-2"><strong>Moeda:</strong> ${currency}</li>
                <li class="mb-2"><strong>Fuso Horário:</strong> ${timezone}</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="col-lg-6 col-md-12 mb-4">
          <div class="card h-100 shadow-sm border-0 rounded-4">
            <div class="card-body p-4">
              <h5 class="fw-bold mb-3"><i class="fas fa-cloud-sun me-2"></i>Clima Atual</h5>
              ${
                weatherData
                  ? `
                <div class="d-flex align-items-center mb-3">
                  <div class="me-3">
                    <i class="fas fa-thermometer-half fa-2x text-warning"></i>
                  </div>
                  <div>
                    <p class="mb-0 fw-bold">${Math.round(
                      weatherData.main.temp
                    )}°C</p>
                    <p class="text-muted text-capitalize">${
                      weatherData.weather[0].description
                    }</p>
                  </div>
                </div>
                <div class="row g-2">
                  <div class="col-6">
                    <small class="text-muted">Sensação</small>
                    <p class="mb-0">${Math.round(
                      weatherData.main.feels_like
                    )}°C</p>
                  </div>
                  <div class="col-6">
                    <small class="text-muted">Umidade</small>
                    <p class="mb-0">${weatherData.main.humidity}%</p>
                  </div>
                </div>
              `
                  : `
                <p class="text-muted">Dados climáticos não disponíveis para este país.</p>
              `
              }
            </div>
          </div>
        </div>

        <div class="col-12 mb-4">
          <div class="card h-100 shadow-sm border-0 rounded-4">
            <div class="card-body p-4 text-center">
              <img src="${countryData.flags.svg}" 
                   alt="Bandeira de ${countryData.name.common}"
                   class="img-fluid rounded-3" 
                   style="max-width: 300px; max-height: 200px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
            </div>
          </div>
        </div>

        <div class="col-12">
          <div class="card h-100 shadow-sm border-0 rounded-4 overflow-hidden position-relative">
            <img src="${imageUrl}" 
                 alt="Imagem de ${countryData.name.common}"
                 class="img-fluid rounded-4"
                 style="object-fit: cover; height: 400px;">
            <div class="card-img-overlay d-flex align-items-end p-4">
              <div class="bg-dark bg-opacity-75 p-3 rounded-3 w-100">
                <h5 class="text-white mb-0">${countryData.name.common}</h5>
                <p class="text-white small mb-0">${region} • ${continent}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = detailsHTML;
  } catch (error) {
    console.error("Falha ao carregar os detalhes:", error);
    container.innerHTML = `
      <div class="alert alert-danger w-100">
        <i class="fas fa-exclamation-triangle me-2"></i>
        Ocorreu um erro ao carregar os detalhes do país.
      </div>
    `;
  }
}

// ----------------------------------------------------------------------
// Inicialização
// ----------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  // Adicione esta nova condição para a página intro.html
  if (window.location.pathname.includes("intro.html")) {
    displayFeaturedCountries();
  }

  if (window.location.pathname.includes("places.html")) {
    // ... (o código existente para places.html permanece aqui)
    const searchTerm = getSearchTermFromUrl();
    if (searchTerm) {
      if (searchCountryInput) {
        searchCountryInput.value = decodeURIComponent(searchTerm);
      }
      searchCountries(decodeURIComponent(searchTerm));
    } else {
      getAllCountries();
    }
  }

  if (window.location.pathname.includes("country.html")) {
    displayCountryDetails();
  }
});

/**
 * Busca e exibe uma seleção de países em destaque.
 */
async function displayFeaturedCountries() {
  const container = document.getElementById("featured-countries-container");
  if (!container) return;

  // Lista de países que queremos destacar
  const featuredCountriesNames = [
    "Brazil",
    "Japan",
    "Italy",
    "Egypt",
    "Australia",
    "Canada",
  ];

  container.innerHTML = `
    <div class="text-center w-100 py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Carregando destinos em destaque...</span>
      </div>
      <p class="mt-3 text-muted">Preparando os melhores destinos para você...</p>
    </div>`;

  try {
    // Buscar dados de todos os países em paralelo
    const countryPromises = featuredCountriesNames.map((name) =>
      fetchAPI(
        `https://restcountries.com/v3.1/name/${name}?fields=name,flags,capital,population,languages,currencies,latlng,region,continents`
      )
    );

    const results = await Promise.all(countryPromises);

    // Criar HTML dos cards com dados completos
    let cardsHTML = "";
    for (let i = 0; i < results.length; i++) {
      const countryData = results[i][0];
      const capital = countryData.capital ? countryData.capital[0] : "N/A";
      const population = new Intl.NumberFormat("pt-BR").format(
        countryData.population
      );
      const language = getComplexData(countryData.languages, "language");
      const currency = getComplexData(countryData.currencies, "currency");
      const region = countryData.region || "N/A";
      const continent =
        countryData.continents && countryData.continents.length > 0
          ? countryData.continents[0]
          : "N/A";

      // Buscar clima se tiver coordenadas
      let weatherData = null;
      if (countryData.latlng && countryData.latlng.length >= 2) {
        try {
          weatherData = await getWeather(
            countryData.latlng[0],
            countryData.latlng[1]
          );
        } catch (weatherError) {
          console.warn(
            `Não foi possível obter clima para ${countryData.name.common}:`,
            weatherError
          );
        }
      }

      cardsHTML += `
        <div class="col-lg-6 col-md-12 mb-4">
          <div class="featured-country-card h-100 shadow-lg border-0 rounded-4 overflow-hidden">
            <!-- Header com bandeira e informações principais -->
            <div class="position-relative">
              <img src="${countryData.flags.svg}" 
                   alt="Bandeira de ${countryData.name.common}"
                   class="featured-flag-img w-100"
                   style="height: 200px; object-fit: cover;">
              <div class="featured-country-overlay d-flex align-items-end p-4">
                <div class="w-100">
                  <h3 class="text-white fw-bold mb-2">${
                    countryData.name.common
                  }</h3>
                  <div class="d-flex flex-wrap gap-2">
                    <span class="badge bg-primary rounded-pill">${continent}</span>
                    <span class="badge bg-success rounded-pill">${region}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Corpo com informações detalhadas -->
            <div class="card-body p-4">
              <div class="row g-3">
                <div class="col-md-6">
                  <h5 class="fw-bold text-primary mb-3">
                    <i class="fas fa-info-circle me-2"></i>Informações
                  </h5>
                  <div class="info-item mb-2">
                    <small class="text-muted">Capital</small>
                    <p class="mb-0 fw-medium">${capital}</p>
                  </div>
                  <div class="info-item mb-2">
                    <small class="text-muted">População</small>
                    <p class="mb-0 fw-medium">${population}</p>
                  </div>
                  <div class="info-item mb-2">
                    <small class="text-muted">Idioma</small>
                    <p class="mb-0 fw-medium">${language}</p>
                  </div>
                  <div class="info-item">
                    <small class="text-muted">Moeda</small>
                    <p class="mb-0 fw-medium">${currency}</p>
                  </div>
                </div>
                
                <div class="col-md-6">
                  <h5 class="fw-bold text-primary mb-3">
                    <i class="fas fa-cloud-sun me-2"></i>Clima
                  </h5>
                  ${
                    weatherData
                      ? `
                    <div class="weather-card bg-light bg-opacity-50 rounded-3 p-3">
                      <div class="d-flex align-items-center mb-2">
                        <i class="fas fa-thermometer-half text-warning me-2"></i>
                        <span class="fw-bold">${Math.round(
                          weatherData.main.temp
                        )}°C</span>
                      </div>
                      <div class="weather-description text-muted small text-capitalize">
                        ${weatherData.weather[0].description}
                      </div>
                      <div class="weather-details mt-2 small">
                        <div class="d-flex justify-content-between">
                          <span>Umidade:</span>
                          <span>${weatherData.main.humidity}%</span>
                        </div>
                        <div class="d-flex justify-content-between">
                          <span>Sensação:</span>
                          <span>${Math.round(
                            weatherData.main.feels_like
                          )}°C</span>
                        </div>
                      </div>
                    </div>
                  `
                      : `
                    <div class="alert alert-info small mb-0">
                      <i class="fas fa-info-circle me-2"></i>
                      Dados climáticos indisponíveis
                    </div>
                  `
                  }
                </div>
              </div>
              
              <!-- Botão de ação -->
              <div class="mt-4">
                <a href="country.html?name=${encodeURIComponent(
                  countryData.name.common
                )}" 
                   class="btn btn-primary w-100 rounded-pill fw-medium">
                  <i class="fas fa-map-marker-alt me-2"></i>Explorar ${
                    countryData.name.common
                  }
                </a>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    container.innerHTML = cardsHTML;
  } catch (error) {
    console.error("Erro ao buscar países em destaque:", error);
    container.innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger text-center" role="alert">
          <i class="fas fa-exclamation-triangle me-2"></i>
          Não foi possível carregar os países em destaque. Por favor, tente novamente mais tarde.
        </div>
      </div>
    `;
  }
}

function showLoadingState() {
  return `
    <div class="col-12 text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Carregando países...</span>
      </div>
      <p class="mt-3 text-muted">Preparando seu próximo destino...</p>
    </div>
  `;
}

// Função para melhorar a acessibilidade
function enhanceAccessibility() {
  // Adicionar aria-labels aos links
  const links = document.querySelectorAll("a");
  links.forEach((link) => {
    if (!link.getAttribute("aria-label") && link.textContent.trim()) {
      link.setAttribute("aria-label", link.textContent.trim());
    }
  });

  // Adicionar focus visível
  const focusableElements = document.querySelectorAll(
    "a, button, input, select"
  );
  focusableElements.forEach((element) => {
    element.addEventListener("focus", () => {
      element.style.outline = "2px solid var(--primary-color)";
    });

    element.addEventListener("blur", () => {
      element.style.outline = "";
    });
  });
}

// Função para animações de scroll
function animateOnScroll() {
  const elements = document.querySelectorAll(".card, h1, h2, h3");
  elements.forEach((element) => {
    element.style.opacity = "0";
    element.style.transform = "translateY(20px)";
    element.style.transition = "opacity 0.6s ease, transform 0.6s ease";
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  });

  elements.forEach((element) => observer.observe(element));
}

// Inicializar quando o DOM carregar
document.addEventListener("DOMContentLoaded", () => {
  enhanceAccessibility();
  animateOnScroll();
});

// Animações de rolagem
document.addEventListener("DOMContentLoaded", () => {
  const animatedSections = document.querySelectorAll(".section-animate");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        } else {
          // Opcional: remover a classe se sair da tela para reanimar ao rolar de volta
          // entry.target.classList.remove('is-visible');
        }
      });
    },
    {
      threshold: 0.1, // A seção se torna visível quando 10% dela está no viewport
    }
  );

  animatedSections.forEach((section) => {
    observer.observe(section);
  });

  // Inicialização automática para páginas específicas
  const currentPage = window.location.pathname.split("/").pop();

  // Se estiver na página places.html, carrega os países automaticamente
  if (currentPage === "places.html" && countriesGrid) {
    // Verifica se há um termo de busca na URL
    const searchTerm = getSearchTermFromUrl();
    if (searchTerm) {
      // Se há termo de busca, executa a busca
      if (searchCountryInput) {
        searchCountryInput.value = searchTerm;
      }
      searchCountries(searchTerm);
    } else {
      // Se não há termo de busca, carrega todos os países
      getAllCountries();
    }
  }

  // Se estiver na página country.html, carrega os detalhes do país
  if (currentPage === "country.html") {
    displayCountryDetails();
  }
});
