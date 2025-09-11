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
  if (!obj) {
    return "N/A";
  }
  try {
    const values = Object.values(obj);
    if (values && values.length > 0) {
      if (type === "currency") {
        return values[0].name;
      } else if (type === "language") {
        return values[0];
      }
    }
    return "N/A";
  } catch (e) {
    console.error(`Erro ao obter dados de ${type}:`, e);
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
  countriesGrid.innerHTML = "";

  if (!countries || countries.length === 0) {
    countriesGrid.innerHTML = `<div class="alert alert-info w-100">Nenhum país encontrado.</div>`;
    return;
  }

  // Assumimos que o array recebido já está na ordem desejada (ordenado in-place quando apropriado)
  const html = countries
    .map((country) => {
      const population = new Intl.NumberFormat("pt-BR").format(
        country.population
      );
      const currency = getComplexData(country.currencies, "currency");
      const language = getComplexData(country.languages, "language");

      return `
      <div class="col">
          <div class="card h-100 shadow-sm">
              <img src="${
                country.flags.svg
              }" class="card-img-top" alt="Bandeira de ${country.name.common}">
              <div class="card-body d-flex flex-column">
                  <h5 class="card-title fw-bold">${country.name.common}</h5>
                  <p class="card-text text-muted mb-auto">
                      Capital: ${
                        country.capital ? country.capital[0] : "N/A"
                      } <br>
                      População: ${population}
                  </p>
                  <p>Moeda: ${currency}</p>
                  <p>Idioma: ${language}</p>
                  <a href="country.html?name=${
                    country.name.common
                  }" class="btn btn-primary mt-3">Ver detalhes</a>
              </div>
          </div>
      </div>
    `;
    })
    .join("");

  countriesGrid.innerHTML = html;
}

/**
 * Função que filtra e exibe os países com base no texto de busca.
 */
async function searchCountries() {
  if (!searchCountryInput) return;

  // Se dados não carregados, pede a API (getAllCountries já mostra spinner por si só)
  if (allCountriesData.length === 0) {
    await getAllCountries();
    return; // getAllCountries chama displayCountriesGrid quando terminar
  }

  const formatedSearch = searchCountryInput.value.toLowerCase().trim();
  // filtro rápido e exibição
  const filteredCountries = allCountriesData.filter((country) =>
    country.name.common.toLowerCase().includes(formatedSearch)
  );

  // Mostra os resultados (ou "nenhum encontrado")
  displayCountriesGrid(filteredCountries);
}

// Adiciona o ouvinte de evento para o filtro de continente
if (continentFilter) {
  continentFilter.addEventListener("change", () => {
    const selectedContinent = continentFilter.value;
    if (selectedContinent === "Todos") {
      getAllCountries();
    } else {
      getCountriesByRegion(selectedContinent);
    }
  });
}

// Adiciona o ouvinte de evento para a busca de país
if (searchCountryInput) {
  const debouncedSearch = debounce(searchCountries, 180);

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

// Chama a função principal quando a página estiver totalmente carregada
document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes("places.html")) {
    getAllCountries();
  }
});

// ----------------------------------------------------------------------
// Lógica para a página de Detalhes do País
// ----------------------------------------------------------------------

/**
 * Pega o nome do país da URL (query parameter).
 * @returns {string} - O nome do país.
 */
function getCountryNameFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("name");
}

/**
 * Busca os dados de um país específico por nome na API Rest Countries.
 * @param {string} countryName - O nome do país.
 * @returns {Promise<object>} - Os dados do país.
 */
async function getCountryData(countryName) {
  const url = `${restCountriesLink}/name/${countryName}?fields=name,capital,population,languages,currencies,latlng,timezones,flags,borders`;
  try {
    const data = await fetchAPI(url);
    // A API de nome retorna um array, então pegamos o primeiro item
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

  // Exibir mensagem de carregamento inicial
  container.innerHTML = `
        <div class="d-flex flex-column align-items-center justify-content-center w-100 p-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Carregando...</span>
            </div>
            <p class="mt-2 text-muted">Carregando detalhes do país...</p>
        </div>
    `;

  try {
    const countryData = await getCountryData(countryName);

    if (!countryData) {
      container.innerHTML = `<div class="alert alert-danger w-100">País não encontrado.</div>`;
      return;
    }

    const [weatherData, imageUrl] = await Promise.all([
      getWeather(countryData.latlng[0], countryData.latlng[1]),
      getCountryImage(countryName),
    ]);

    const population = new Intl.NumberFormat("pt-BR").format(
      countryData.population
    );
    const currency = getComplexData(countryData.currencies, "currency");
    const language = getComplexData(countryData.languages, "language");
    const weather = weatherData
      ? `${weatherData.main.temp}°C, ${weatherData.weather[0].description}`
      : "N/A";

    // Cria o HTML final da página de detalhes
    const detailsHTML = `
            <div class="row">
                <div class="col-12 text-center mb-4">
                    <h1 class="display-3 fw-bold">${
                      countryData.name.common
                    }</h1>
                    <p class="lead">${countryData.name.official}</p>
                </div>
                <div class="col-lg-6 mb-4">
                    <div class="card h-100 shadow-sm">
                        <img src="${
                          countryData.flags.svg
                        }" class="card-img-top" alt="Bandeira do ${
      countryData.name.common
    }">
                        <div class="card-body">
                            <h5>Informações do País</h5>
                            <ul class="list-unstyled">
                                <li><strong>Capital:</strong> ${
                                  countryData.capital
                                    ? countryData.capital[0]
                                    : "N/A"
                                }</li>
                                <li><strong>População:</strong> ${population}</li>
                                <li><strong>Idioma:</strong> ${language}</li>
                                <li><strong>Moeda:</strong> ${currency}</li>
                                <li><strong>Fuso Horário:</strong> ${
                                  countryData.timezones[0]
                                }</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="col-lg-6 mb-4">
                    <div class="card h-100 shadow-sm">
                        <div class="card-body d-flex flex-column justify-content-between">
                            <div>
                                <h5>Clima</h5>
                                <p>${weather}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 mt-4">
                    <img src="${imageUrl}" class="img-fluid rounded shadow" alt="Imagem de ${
      countryData.name.common
    }">
                </div>
            </div>
        `;
    container.innerHTML = detailsHTML;
  } catch (error) {
    console.error("Falha ao carregar os detalhes:", error);
    container.innerHTML = `<div class="alert alert-danger w-100">Ocorreu um erro ao carregar os detalhes do país.</div>`;
  }
}

// ----------------------------------------------------------------------
// Inicialização
// ----------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  // Adiciona esta verificação
  if (window.location.pathname.includes("country.html")) {
    displayCountryDetails();
  }
});

// A função de busca global que será chamada em todas as páginas
function globalSearch() {
  const searchTerm = searchCountryInput.value.trim();

  if (searchTerm === "") {
    return; // Não faz nada se a busca estiver vazia
  }

  if (window.location.pathname.includes("places.html")) {
    // Se já estiver na página de países, chama a função de busca local
    searchCountries();
  } else {
    // Se estiver em outra página, redireciona para places.html com o termo de busca na URL
    window.location.href = `places.html?search=${encodeURIComponent(
      searchTerm
    )}`;
  }
}
