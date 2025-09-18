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
    console.warn("Elemento countries-grid não encontrado");
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

    // Verificar se os dados foram recebidos corretamente
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error("Dados de países não recebidos ou inválidos");
    }

    // ordena in-place para máxima performance e evita cópias desnecessárias
    sortCountriesInPlace(data);

    // guarda no seu array global já ordenado
    allCountriesData = data;

    // exibe (agora já ordenado)
    displayCountriesGrid(allCountriesData);

    console.log(`Carregados ${data.length} países com sucesso`);
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
  if (!countriesGrid) {
    console.warn("Elemento countries-grid não encontrado");
    return;
  }

  countriesGrid.setAttribute("aria-busy", "true");

  try {
    countriesGrid.innerHTML =
      '<div class="text-center w-100"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Carregando...</span></div></div>';
    const url = `https://restcountries.com/v3.1/region/${region}?fields=name,flags,capital,population,continents,languages,currencies`;
    const data = await fetchAPI(url);

    // Verificar se os dados foram recebidos corretamente
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error("Dados de países da região não recebidos ou inválidos");
    }

    // ordena in-place e guarda
    sortCountriesInPlace(data);
    allCountriesData = data;

    displayCountriesGrid(data);

    console.log(
      `Carregados ${data.length} países da região ${region} com sucesso`
    );
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
        const countryName =
          country.translations?.por?.common ||
          country.name?.common ||
          "País desconhecido";

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
  const filteredCountries = allCountriesData.filter(
    (country) =>
      country.name.common.toLowerCase().includes(formatedSearch) ||
      (country.translations?.por?.common &&
        country.translations.por.common.toLowerCase().includes(formatedSearch))
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
/**
 * Busca os dados de um país específico por nome na API Rest Countries.
 * @param {string} countryName - O nome do país (pode estar em qualquer idioma, incluindo português).
 * @returns {Promise<object>} - Os dados do país.
 */
async function getCountryData(countryName) {
  const encodedName = encodeURIComponent(countryName);
  const urlByNameFull = `https://restcountries.com/v3.1/name/${encodedName}?fullText=true&fields=name,capital,population,languages,currencies,latlng,timezones,flags,borders,region,subregion,continents,translations,cca3,idd,tld`;
  const urlByTranslation = `https://restcountries.com/v3.1/translation/${encodedName}?fields=name,capital,population,languages,currencies,latlng,timezones,flags,borders,region,subregion,continents,translations,cca3,idd,tld`;
  const urlByNameLoose = `https://restcountries.com/v3.1/name/${encodedName}?fields=name,capital,population,languages,currencies,latlng,timezones,flags,borders,region,subregion,continents,translations,cca3,idd,tld`;

  // helper que tenta fetchAPI mas retorna null em 404
  async function tryFetchSafe(url) {
    try {
      const data = await fetchAPI(url);
      return data && data.length ? data[0] : null;
    } catch (e) {
      // se for 404 apenas retorna null para tentar a próxima opção
      if (e.message && e.message.includes("404")) {
        return null;
      }
      // para outros erros, relança
      throw e;
    }
  }

  try {
    let result = await tryFetchSafe(urlByNameFull);
    if (result) return result;

    result = await tryFetchSafe(urlByTranslation);
    if (result) return result;

    // fallback: busca solta (sem fullText)
    result = await tryFetchSafe(urlByNameLoose);
    if (result) return result;

    return null;
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
/**
 * Função principal para a página de detalhes do país — versão aprimorada.
 */
async function displayCountryDetails() {
  const container = document.getElementById("country-details-container");
  const countryName = getCountryNameFromUrl();

  if (!countryName || !container) {
    return;
  }

  // Estado de carregamento
  container.innerHTML = `
    <div class="d-flex flex-column align-items-center justify-content-center w-100 p-5 my-5">
      <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
        <span class="visually-hidden">Carregando...</span>
      </div>
      <p class="mt-3 text-muted fs-5">Descobrindo o destino perfeito...</p>
    </div>
  `;

  try {
    const countryData = await getCountryData(countryName);

    if (!countryData) {
      throw new Error("Dados do país não encontrados");
    }

    const [weatherData, imageUrl] = await Promise.all([
      countryData.latlng && countryData.latlng.length === 2
        ? getWeather(countryData.latlng[0], countryData.latlng[1])
        : Promise.resolve(null),
      getCountryImage(countryName),
    ]);

    // Formatação de dados
    const population = countryData.population
      ? new Intl.NumberFormat("pt-BR").format(countryData.population)
      : "Não disponível";
    const area = countryData.area
      ? `${new Intl.NumberFormat("pt-BR").format(countryData.area)} km²`
      : "Não disponível";
    const currency =
      getComplexData(countryData.currencies, "currency") || "Não disponível";
    const language =
      getComplexData(countryData.languages, "language") || "Não disponível";
    const timezone =
      (countryData.timezones && countryData.timezones[0]) || "Não disponível";
    const capital =
      (countryData.capital && countryData.capital[0]) || "Não disponível";
    const region = countryData.region || "Não disponível";
    const subregion = countryData.subregion || "Não disponível";
    const continent =
      (countryData.continents && countryData.continents[0]) || "Não disponível";
    const borders = countryData.borders
      ? countryData.borders.map((code) => code.toUpperCase()).join(", ") ||
        "Sem fronteiras terrestres"
      : "Sem fronteiras terrestres";
    const independent =
      countryData.independent !== undefined
        ? countryData.independent
          ? "Sim"
          : "Não"
        : "Não informado";

    // Clima
    const weather = weatherData
      ? `${Math.round(weatherData.main.temp)}°C, ${
          weatherData.weather[0].description
        }`
      : "Clima não disponível";

    // Geração do HTML aprimorado
    const detailsHTML = `
  <div class="container py-4">
    <!-- Título e bandeira -->
    <div class="row align-items-center mb-5">
      <div class="col-md-8">
        <h1 class="display-4 fw-bold text-primary mb-2">
          ${countryData.translations?.por?.common || countryData.name.common}
        </h1>
        <p class="lead text-muted mb-1">
          ${
            countryData.translations?.por?.official || countryData.name.official
          }
        </p>
            <div class="d-flex flex-wrap gap-2 mt-3">
              <span class="badge bg-info-subtle text-info-emphasis">${continent}</span>
              <span class="badge bg-success-subtle text-success-emphasis">${region}</span>
              <span class="badge bg-warning-subtle text-warning-emphasis">${subregion}</span>
              <span class="badge bg-secondary-subtle text-secondary-emphasis">${capital}</span>
            </div>
          </div>
          <div class="col-md-4 text-center">
            <img src="${countryData.flags.svg || countryData.flags.png}" 
                 alt="Bandeira de ${countryData.name.common}"
                 class="img-fluid rounded-4 shadow-sm"
                 style="max-height: 180px; object-fit: contain;">
          </div>
        </div>

        <!-- Cards principais em grid -->
        <div class="row g-4 mb-5">

          <!-- Card: Informações Essenciais -->
          <div class="col-lg-4 col-md-6">
            <div class="card h-100 shadow-sm border-0 rounded-4 transition-card">
              <div class="card-header bg-primary text-white py-3">
                <h5 class="mb-0"><i class="fas fa-info-circle me-2"></i>Informações Essenciais</h5>
              </div>
              <div class="card-body">
                <ul class="list-unstyled">
                  <li class="mb-3"><strong><i class="fas fa-globe me-2 text-muted"></i>Continente:</strong> ${continent}</li>
                  <li class="mb-3"><strong><i class="fas fa-map-marker-alt me-2 text-muted"></i>Região:</strong> ${region}</li>
                  <li class="mb-3"><strong><i class="fas fa-building me-2 text-muted"></i>Capital:</strong> ${capital}</li>
                  <li class="mb-3"><strong><i class="fas fa-users me-2 text-muted"></i>População:</strong> ${population}</li>
                  <li class="mb-3"><strong><i class="fas fa-ruler-combined me-2 text-muted"></i>Área:</strong> ${area}</li>
                  <li class="mb-3"><strong><i class="fas fa-language me-2 text-muted"></i>Idioma:</strong> ${language}</li>
                  <li class="mb-3"><strong><i class="fas fa-money-bill-wave me-2 text-muted"></i>Moeda:</strong> ${currency}</li>
                  <li class="mb-3"><strong><i class="fas fa-clock me-2 text-muted"></i>Fuso Horário:</strong> ${timezone}</li>
                  <li class="mb-3"><strong><i class="fas fa-flag-checkered me-2 text-muted"></i>Independente:</strong> ${independent}</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Card: Clima Atual -->
          <div class="col-lg-4 col-md-6">
            <div class="card h-100 shadow-sm border-0 rounded-4 transition-card">
              <div class="card-header bg-success text-white py-3">
                <h5 class="mb-0"><i class="fas fa-cloud-sun me-2"></i>Clima Atual</h5>
              </div>
              <div class="card-body d-flex flex-column justify-content-center">
                ${
                  weatherData
                    ? `
                      <div class="text-center mb-4">
                        <div class="display-5 fw-bold text-warning">${Math.round(
                          weatherData.main.temp
                        )}°C</div>
                        <p class="text-muted text-capitalize mb-1">${
                          weatherData.weather[0].description
                        }</p>
                        <img src="https://openweathermap.org/img/wn/${
                          weatherData.weather[0].icon
                        }@2x.png" 
                             alt="Ícone do clima" class="img-fluid" style="max-height: 80px;">
                      </div>
                      <div class="row text-center g-3">
                        <div class="col-6">
                          <div class="small text-muted">Sensação</div>
                          <div class="fw-bold">${Math.round(
                            weatherData.main.feels_like
                          )}°C</div>
                        </div>
                        <div class="col-6">
                          <div class="small text-muted">Umidade</div>
                          <div class="fw-bold">${
                            weatherData.main.humidity
                          }%</div>
                        </div>
                        <div class="col-6">
                          <div class="small text-muted">Mínima</div>
                          <div class="fw-bold">${Math.round(
                            weatherData.main.temp_min
                          )}°C</div>
                        </div>
                        <div class="col-6">
                          <div class="small text-muted">Máxima</div>
                          <div class="fw-bold">${Math.round(
                            weatherData.main.temp_max
                          )}°C</div>
                        </div>
                      </div>
                    `
                    : `
                      <div class="text-center py-5">
                        <i class="fas fa-cloud-sun fa-3x text-secondary opacity-50 mb-3"></i>
                        <p class="text-muted">Dados climáticos indisponíveis para este local.</p>
                      </div>
                    `
                }
              </div>
            </div>
          </div>

          <!-- Card: Fronteiras e Geopolítica -->
          <div class="col-lg-4 col-md-12">
            <div class="card h-100 shadow-sm border-0 rounded-4 transition-card">
              <div class="card-header bg-warning text-white py-3">
                <h5 class="mb-0"><i class="fas fa-border-all me-2"></i>Fronteiras & Geopolítica</h5>
              </div>
              <div class="card-body">
                <ul class="list-unstyled">
                  <li class="mb-3"><strong><i class="fas fa-globe-americas me-2 text-muted"></i>Países Vizinhos:</strong><br> <span class="text-break">${borders}</span></li>
                  <li class="mb-3"><strong><i class="fas fa-passport me-2 text-muted"></i>Código Telefônico:</strong> ${
                    countryData.idd?.root || ""
                  }${countryData.idd?.suffixes?.[0] || "N/A"}</li>
                  <li class="mb-3"><strong><i class="fas fa-tachometer-alt me-2 text-muted"></i>Domínio de Internet:</strong> ${
                    countryData.tld?.[0] || "N/A"
                  }</li>
                  <li class="mb-3"><strong><i class="fas fa-building-columns me-2 text-muted"></i>Nome Nativo:</strong><br> <span class="text-break">${
                    Object.values(countryData.name.nativeName || {})
                      .map((n) => n.common)
                      .join(", ") || "N/A"
                  }</span></li>
                </ul>
              </div>
            </div>
          </div>

        </div>

        <!-- Imagem Hero com sobreposição -->
        <div class="row mb-5">
          <div class="col-12">
            <div class="card border-0 rounded-4 overflow-hidden position-relative shadow-lg">
              <img src="${
                imageUrl ||
                "https://via.placeholder.com/1200x500?text=Imagem+do+" +
                  encodeURIComponent(countryName)
              }" 
                   alt="Paisagem de ${countryData.name.common}"
                   class="img-fluid w-100" style="height: 500px; object-fit: cover;">
              <div class="card-img-overlay d-flex flex-column justify-content-end p-4">
                <div class="bg-dark bg-opacity-75 p-4 rounded-4">
                  <h3 class="text-white mb-2">
  ${countryData.translations?.por?.common || countryData.name.common}
</h3>
                  <p class="text-white mb-0">${capital} • ${region} • ${continent}</p>
                
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Dados adicionais em cards menores -->
        <div class="row g-4">
          <div class="col-md-6 col-lg-3">
            <div class="card text-center shadow-sm border-0 rounded-4 h-100 transition-card">
              <div class="card-body d-flex flex-column justify-content-center">
                <i class="fas fa-users fa-2x text-primary mb-3"></i>
                <h5 class="card-title">População</h5>
                <p class="card-text fw-bold">${population}</p>
              </div>
            </div>
          </div>
          <div class="col-md-6 col-lg-3">
            <div class="card text-center shadow-sm border-0 rounded-4 h-100 transition-card">
              <div class="card-body d-flex flex-column justify-content-center">
                <i class="fas fa-ruler-combined fa-2x text-success mb-3"></i>
                <h5 class="card-title">Área</h5>
                <p class="card-text fw-bold">${area}</p>
              </div>
            </div>
          </div>
          <div class="col-md-6 col-lg-3">
            <div class="card text-center shadow-sm border-0 rounded-4 h-100 transition-card">
              <div class="card-body d-flex flex-column justify-content-center">
                <i class="fas fa-language fa-2x text-info mb-3"></i>
                <h5 class="card-title">Idioma</h5>
                <p class="card-text fw-bold">${language}</p>
              </div>
            </div>
          </div>
          <div class="col-md-6 col-lg-3">
            <div class="card text-center shadow-sm border-0 rounded-4 h-100 transition-card">
              <div class="card-body d-flex flex-column justify-content-center">
                <i class="fas fa-money-bill-wave fa-2x text-warning mb-3"></i>
                <h5 class="card-title">Moeda</h5>
                <p class="card-text fw-bold">${currency}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = detailsHTML;

    // Adiciona efeito de hover nos cards (opcional, via JS ou CSS)
    document.querySelectorAll(".transition-card").forEach((card) => {
      card.addEventListener("mouseenter", () =>
        card.classList.add("shadow-lg")
      );
      card.addEventListener("mouseleave", () =>
        card.classList.remove("shadow-lg")
      );
    });
  } catch (error) {
    console.error("Falha ao carregar os detalhes:", error);
    container.innerHTML = `
      <div class="container py-5">
        <div class="alert alert-danger d-flex align-items-center rounded-4" role="alert">
          <i class="fas fa-exclamation-triangle fa-2x me-3"></i>
          <div>
            <h4 class="alert-heading">Erro ao carregar o país</h4>
            <p>Ocorreu um erro inesperado. Verifique sua conexão ou tente novamente mais tarde.</p>
            <hr>
            <small>Detalhes técnicos: ${error.message}</small>
          </div>
        </div>
      </div>
    `;
  }
}

/**
 * Busca e exibe uma seleção de países em destaque com design premium.
 */
async function displayFeaturedCountries() {
  const container = document.getElementById("featured-countries-container");
  if (!container) return;

  // Lista de países estrategicamente escolhidos para máximo impacto visual
  const featuredCountriesNames = [
    "Brazil",
    "Japan",
    "Italy",
    "Egypt",
    "Australia",
    "Canada",
  ];

  container.innerHTML = `
    <div class="loading-hero d-flex flex-column align-items-center justify-content-center py-5">
      <div class="loading-animation">
        <div class="globe-loader"></div>
      </div>
      <h3 class="mt-4 text-primary fw-bold">Descobrindo Destinos Extraordinários</h3>
      <p class="text-muted fs-5">Preparando experiências únicas para você...</p>
    </div>
    <style>
      .globe-loader {
        width: 60px;
        height: 60px;
        border: 4px solid rgba(var(--bs-primary-rgb), 0.1);
        border-top: 4px solid var(--bs-primary);
        border-radius: 50%;
        animation: spin 1.5s linear infinite;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>`;

  try {
    // Buscar dados de todos os países em paralelo com tratamento de erro individual
    const countryPromises = featuredCountriesNames.map(async (name) => {
      try {
        return await getCountryData(name);
      } catch (error) {
        console.warn(`Erro ao buscar ${name}:`, error);
        return null;
      }
    });

    const results = await Promise.all(countryPromises);
    const validResults = results.filter((country) => country !== null);

    if (validResults.length === 0) {
      throw new Error("Nenhum país em destaque foi encontrado");
    }

    // Buscar imagens e clima para todos os países válidos
    const enhancedCountries = await Promise.all(
      validResults.map(async (countryData) => {
        const [weatherData, imageUrl] = await Promise.all([
          countryData.latlng && countryData.latlng.length >= 2
            ? getWeather(countryData.latlng[0], countryData.latlng[1]).catch(
                () => null
              )
            : Promise.resolve(null),
          getCountryImage(countryData.name.common).catch(() => null),
        ]);

        return { countryData, weatherData, imageUrl };
      })
    );

    // Criar HTML com design premium e impactante
    let cardsHTML = "";

    enhancedCountries.forEach(
      ({ countryData, weatherData, imageUrl }, index) => {
        const displayedCountryName =
          countryData.translations?.por?.common ||
          countryData.name.common ||
          "País desconhecido";

        const capital = countryData.capital ? countryData.capital[0] : "N/A";
        const population = new Intl.NumberFormat("pt-BR").format(
          countryData.population
        );
        const language = getComplexData(countryData.languages, "language");
        const currency = getComplexData(countryData.currencies, "currency");
        const region = countryData.region || "N/A";
        const continent = countryData.continents?.[0] || "N/A";

        // Definir gradientes únicos para cada país
        const gradients = [
          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
          "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
          "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
          "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
        ];

        const cardGradient = gradients[index % gradients.length];

        cardsHTML += `
        <div class="col-lg-4 col-md-6 mb-5">
          <div class="featured-country-premium-card" data-aos="fade-up" data-aos-delay="${
            index * 100
          }">
            <!-- Hero Image Section -->
            <div class="card-hero-section">
              <div class="hero-image-container">
                ${
                  imageUrl
                    ? `
                  <img src="${imageUrl}" 
                       alt="Paisagem de ${displayedCountryName}"
                       class="hero-background-image"
                       loading="lazy">
                `
                    : ""
                }
                <div class="hero-gradient-overlay" style="background: ${cardGradient}"></div>
                <div class="hero-content">
                  <div class="country-flag-premium">
                    <img src="${countryData.flags.svg}" 
                         alt="Bandeira de ${displayedCountryName}"
                         onerror="this.src='https://via.placeholder.com/80x60?text=Flag'">
                  </div>
                  <h2 class="country-name-hero">${displayedCountryName}</h2>
                  <div class="location-badges">
                    <span class="location-badge primary">${continent}</span>
                    <span class="location-badge secondary">${region}</span>
                  </div>
                </div>
                
                <!-- Weather Widget Floating -->
                ${
                  weatherData
                    ? `
                  <div class="weather-widget-floating">
                    <div class="weather-temp">${Math.round(
                      weatherData.main.temp
                    )}°</div>
                    <div class="weather-desc">${
                      weatherData.weather[0].description
                    }</div>
                    <div class="weather-icon">
                      <img src="https://openweathermap.org/img/wn/${
                        weatherData.weather[0].icon
                      }@2x.png" 
                           alt="Clima" style="width: 40px; height: 40px;">
                    </div>
                  </div>
                `
                    : ""
                }
              </div>
            </div>
            
            <!-- Premium Info Panel -->
            <div class="premium-info-panel">
              <div class="info-stats-grid">
                <div class="stat-item">
                  <div class="stat-icon">
                    <i class="fas fa-city"></i>
                  </div>
                  <div class="stat-content">
                    <span class="stat-label">Capital</span>
                    <span class="stat-value">${capital}</span>
                  </div>
                </div>
                
                <div class="stat-item">
                  <div class="stat-icon">
                    <i class="fas fa-users"></i>
                  </div>
                  <div class="stat-content">
                    <span class="stat-label">População</span>
                    <span class="stat-value">${population}</span>
                  </div>
                </div>
                
                <div class="stat-item">
                  <div class="stat-icon">
                    <i class="fas fa-comments"></i>
                  </div>
                  <div class="stat-content">
                    <span class="stat-label">Idioma</span>
                    <span class="stat-value">${language}</span>
                  </div>
                </div>
                
                <div class="stat-item">
                  <div class="stat-icon">
                    <i class="fas fa-coins"></i>
                  </div>
                  <div class="stat-content">
                    <span class="stat-label">Moeda</span>
                    <span class="stat-value">${currency}</span>
                  </div>
                </div>
              </div>
              
              <!-- Premium Action Button -->
              <a href="country.html?name=${encodeURIComponent(
                displayedCountryName
              )}" 
                 class="premium-explore-btn">
                <span class="btn-text">
                  <i class="fas fa-rocket me-2"></i>
                  Explorar ${displayedCountryName}
                </span>
                <span class="btn-arrow">
                  <i class="fas fa-arrow-right"></i>
                </span>
              </a>
            </div>
          </div>
        </div>
      `;
      }
    );

    // CSS para o design premium
    const premiumCSS = `
      <style>
        .featured-country-premium-card {
          background: #ffffff;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.1);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          height: 520px;
        }
        
        .featured-country-premium-card:hover {
          transform: translateY(-12px) scale(1.02);
          box-shadow: 0 30px 80px rgba(0,0,0,0.15);
        }
        
        .card-hero-section {
          height: 280px;
          position: relative;
          overflow: hidden;
        }
        
        .hero-image-container {
          position: relative;
          height: 100%;
        }
        
        .hero-background-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }
        
        .featured-country-premium-card:hover .hero-background-image {
          transform: scale(1.1);
        }
        
        .hero-gradient-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          opacity: 0.85;
          z-index: 1;
        }
        
        .hero-content {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 2;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          color: white;
          padding: 2rem;
        }
        
        .country-flag-premium {
          width: 80px;
          height: 60px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          margin-bottom: 1.5rem;
          border: 3px solid rgba(255,255,255,0.2);
        }
        
        .country-flag-premium img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .country-name-hero {
          font-size: 2.2rem;
          font-weight: 800;
          margin-bottom: 1rem;
          text-shadow: 0 4px 12px rgba(0,0,0,0.3);
          letter-spacing: -0.5px;
        }
        
        .location-badges {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          justify-content: center;
        }
        
        .location-badge {
          padding: 0.5rem 1.2rem;
          border-radius: 50px;
          font-weight: 600;
          font-size: 0.85rem;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
        }
        
        .location-badge.primary {
          background: rgba(255,255,255,0.25);
          color: white;
        }
        
        .location-badge.secondary {
          background: rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.9);
        }
        
        .weather-widget-floating {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(15px);
          border-radius: 16px;
          padding: 1rem;
          text-align: center;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          z-index: 3;
          min-width: 100px;
        }
        
        .weather-temp {
          font-size: 1.8rem;
          font-weight: 800;
          color: #2d3748;
          line-height: 1;
        }
        
        .weather-desc {
          font-size: 0.75rem;
          color: #718096;
          text-transform: capitalize;
          margin: 0.25rem 0;
          font-weight: 500;
        }
        
        .weather-icon {
          margin-top: -0.5rem;
        }
        
        .premium-info-panel {
          padding: 2rem;
          background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
          height: 240px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        
        .info-stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .stat-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1rem;
          flex-shrink: 0;
        }
        
        .stat-content {
          flex: 1;
          min-width: 0;
        }
        
        .stat-label {
          display: block;
          font-size: 0.75rem;
          color: #718096;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.25rem;
        }
        
        .stat-value {
          display: block;
          font-size: 0.95rem;
          color: #2d3748;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .premium-explore-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          border-radius: 16px;
          font-weight: 700;
          font-size: 1rem;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .premium-explore-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.6s ease;
        }
        
        .premium-explore-btn:hover::before {
          left: 100%;
        }
        
        .premium-explore-btn:hover {
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 12px 36px rgba(102, 126, 234, 0.4);
        }
        
        .btn-arrow {
          width: 32px;
          height: 32px;
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease;
        }
        
        .premium-explore-btn:hover .btn-arrow {
          transform: translateX(4px);
        }
        
        @media (max-width: 768px) {
          .featured-country-premium-card {
            height: auto;
          }
          
          .card-hero-section {
            height: 220px;
          }
          
          .country-name-hero {
            font-size: 1.8rem;
          }
          
          .info-stats-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          
          .premium-info-panel {
            height: auto;
            padding: 1.5rem;
          }
        }
      </style>
    `;

    container.innerHTML =
      premiumCSS + '<div class="row">' + cardsHTML + "</div>";

    console.log(
      `Carregados ${validResults.length} países em destaque com design premium`
    );
  } catch (error) {
    console.error("Erro ao buscar países em destaque:", error);
    container.innerHTML = `
      <div class="col-12">
        <div class="premium-error-card text-center p-5 rounded-4">
          <div class="error-icon mb-4">
            <i class="fas fa-globe-americas fa-4x text-muted opacity-50"></i>
          </div>
          <h3 class="text-dark mb-3">Ops! Algo deu errado</h3>
          <p class="text-muted mb-4 fs-5">Não conseguimos carregar os destinos em destaque no momento.</p>
          <div class="d-flex gap-3 justify-content-center flex-wrap">
            <button class="btn btn-primary btn-lg rounded-pill px-4" onclick="displayFeaturedCountries()">
              <i class="fas fa-redo-alt me-2"></i>Tentar Novamente
            </button>
            <a href="places.html" class="btn btn-outline-primary btn-lg rounded-pill px-4">
              <i class="fas fa-globe me-2"></i>Ver Todos os Países
            </a>
          </div>
        </div>
      </div>
      <style>
        .premium-error-card {
          background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
          box-shadow: 0 20px 60px rgba(0,0,0,0.08);
          border: 1px solid #e2e8f0;
        }
      </style>
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

// Função de inicialização principal
function initializeApp() {
  console.log("Inicializando aplicação NoMap...");

  // Melhorar acessibilidade
  enhanceAccessibility();

  // Configurar animações
  animateOnScroll();

  // Configurar animações de seções
  const animatedSections = document.querySelectorAll(".section-animate");
  if (animatedSections.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      {
        threshold: 0.1,
      }
    );

    animatedSections.forEach((section) => {
      observer.observe(section);
    });
  }

  // Inicialização específica por página
  const currentPage = window.location.pathname.split("/").pop();
  console.log("Página atual:", currentPage);

  // Página de países em destaque
  if (currentPage === "intro.html") {
    console.log("Carregando países em destaque...");
    displayFeaturedCountries();
  }

  // Página de todos os países
  if (currentPage === "places.html") {
    console.log("Inicializando página de países...");

    // Aguardar um pouco para garantir que todos os elementos estejam carregados
    setTimeout(() => {
      const searchTerm = getSearchTermFromUrl();
      if (searchTerm) {
        console.log("Executando busca por:", searchTerm);
        if (searchCountryInput) {
          searchCountryInput.value = decodeURIComponent(searchTerm);
        }
        searchCountries(decodeURIComponent(searchTerm));
      } else {
        console.log("Carregando todos os países...");
        getAllCountries();
      }
    }, 100);
  }

  // Página de detalhes do país
  if (currentPage === "country.html") {
    console.log("Carregando detalhes do país...");
    displayCountryDetails();
  }
}

// Inicialização quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", initializeApp);

// Fallback: se por algum motivo o DOMContentLoaded não disparar
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  // DOM já está carregado
  initializeApp();
}

// Expor funções globalmente para debug
window.getAllCountries = getAllCountries;
window.allCountriesData = allCountriesData;
window.displayCountriesGrid = displayCountriesGrid;
