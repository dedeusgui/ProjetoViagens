const weatherKey = "c26c5146c2c101254e53b49b3e12e8d6";
const unplashKey = "qEI-_nCL8zMTZvEMz-iRMgluWKn1uxM_8yS0s_l7NLg";
const restCountriesLink = "https://restcountries.com/v3.1/all";

async function fetchAPI(url) {
  try {
    const response = await fetch(url);

    // Verifica se a resposta foi bem-sucedida (status 200-299)
    if (!response.ok) {
      throw new Error(
        `Erro na requisição: ${response.status} ${response.statusText}`
      );
    }

    // Converte a resposta para JSON
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Falha na conexão com a API:", error);
    throw error; // Lança o erro para que a função chamadora possa tratá-lo
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

// A base de dados principal para todos os países
let allCountriesData = [];

// Seleciona o contêiner onde os cards serão exibidos
const countriesGrid = document.getElementById("countries-grid");
const continentFilter = document.getElementById("continent-filter");

/**
 * Função principal para buscar todos os países da API.
 */
/**
 * Função principal para buscar todos os países da API.
 */
async function getAllCountries() {
  if (!countriesGrid) {
    return;
  }

  try {
    countriesGrid.innerHTML =
      '<div class="text-center w-100"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Carregando...</span></div></div>';

    // URL da API com os campos obrigatórios
    // URL da API com mais campos
    const url =
      "https://restcountries.com/v3.1/all?fields=name,flags,capital,population,continents,languages,currencies";

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.statusText}`);
    }

    const data = await response.json();

    allCountriesData = data;

    displayCountriesGrid(allCountriesData);
  } catch (error) {
    console.error("Ocorreu um erro ao buscar os países:", error);
    countriesGrid.innerHTML = `<div class="alert alert-danger w-100" role="alert">Não foi possível carregar os países. Por favor, tente novamente mais tarde.</div>`;
  }
}
/**
 * Função para criar e exibir os cards dos países no grid.
 * @param {Array} countries - Array de objetos com dados de países.
 */
function displayCountriesGrid(countries) {
  countriesGrid.innerHTML = ""; // Limpa o conteúdo anterior

  countries.forEach((country) => {
    // Formata a população com separadores de milhares
    // Dentro da sua função displayCountriesGrid, no loop 'forEach':

    const population = new Intl.NumberFormat("pt-BR").format(
      country.population
    );
    // Usa a nova função para extrair a moeda e o idioma
    const currency = getComplexData(country.currencies, "currency");
    const language = getComplexData(country.languages, "language");

    const cardHTML = `
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

    countriesGrid.innerHTML += cardHTML;
  });
}
async function getCountriesByRegion(region) {
  if (!countriesGrid) return;

  try {
    countriesGrid.innerHTML =
      '<div class="text-center w-100"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Carregando...</span></div></div>';

    const url =
      "https://restcountries.com/v3.1/all?fields=name,flags,capital,population,continents,languages,currencies";

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Erro ao filtrar por continente: ${response.statusText}`);
    }

    const data = await response.json();
    displayCountriesGrid(data);
  } catch (error) {
    console.error("Ocorreu um erro ao buscar por região:", error);
    countriesGrid.innerHTML = `<div class="alert alert-danger w-100" role="alert">Não foi possível carregar os países do continente.</div>`;
  }
}

// ... (código para a função displayCountriesGrid) ...

/**
 * Adiciona o ouvinte de evento para o filtro de continente.
 */
if (continentFilter) {
  continentFilter.addEventListener("change", () => {
    const selectedContinent = continentFilter.value;

    if (selectedContinent === "Filtrar por continente") {
      // Se a opção padrão for selecionada, busca todos os países
      getAllCountries();
    } else {
      // Chama a nova função que busca por região na API
      getCountriesByRegion(selectedContinent);
    }
  });
}
function searchCountries() {}

// Chama a função principal quando a página estiver totalmente carregada
document.addEventListener("DOMContentLoaded", () => {
  // Apenas para a página places.html
  if (window.location.pathname.includes("places.html")) {
    getAllCountries();
  }
});
