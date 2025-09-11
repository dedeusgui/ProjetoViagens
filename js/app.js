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

// Configura busca global no header (redireciona para places.html com query)
const headerSearchInput =
  document.getElementById("search-input") ||
  document.getElementById("global-search") ||
  document.querySelector("header input") ||
  document.querySelector("input[data-global-search]");
const headerSearchButton =
  document.getElementById("search-btn") ||
  document.getElementById("global-search-btn") ||
  document.querySelector("header button") ||
  document.querySelector("button[data-global-search-btn]");

if (headerSearchInput) {
  headerSearchInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const value = headerSearchInput.value.trim();
      if (!value) return;
      // redireciona para places.html com o termo de busca na query
      window.location.href = `places.html?search=${encodeURIComponent(value)}`;
    }
  });
}

if (headerSearchButton) {
  headerSearchButton.addEventListener("click", (event) => {
    event.preventDefault();
    const value = headerSearchInput ? headerSearchInput.value.trim() : "";
    if (!value) return;
    window.location.href = `places.html?search=${encodeURIComponent(value)}`;
  });
}

// Chama a função principal quando a página estiver totalmente carregada
document.addEventListener("DOMContentLoaded", async () => {
  if (window.location.pathname.includes("places.html")) {
    // Se houver um parâmetro de busca na URL, preenche o campo local para o usuário ver
    const params = new URLSearchParams(window.location.search);
    const q = params.get("search");
    if (q && typeof searchCountryInput !== "undefined" && searchCountryInput) {
      searchCountryInput.value = q;
      // aguarda o carregamento dos países e então executa a busca automática
      await getAllCountries();
      // chama a busca para filtrar allCountriesData já carregado
      searchCountries();
      return;
    }

    // Sem query de busca, carrega normalmente
    await getAllCountries();
  }
});
