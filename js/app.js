// ===========================
// Configuração e Constantes
// ===========================

const CONFIG = {
  api: {
    weather: {
      key: "c26c5146c2c101254e53b49b3e12e8d6",
      baseUrl: "https://api.openweathermap.org/data/2.5/weather",
    },
    unsplash: {
      key: "qEI-_nCL8zMTZvEMz-iRMgluWKn1uxM_8yS0s_l7NLg",
      baseUrl: "https://api.unsplash.com/search/photos",
    },
    restCountries: {
      baseUrl: "https://restcountries.com/v3.1",
    },
  },
  defaults: {
    placeholderFlag: "https://via.placeholder.com/300x200?text=Bandeira",
    placeholderImage: "https://via.placeholder.com/1920x1080?text=NoMap",
  },
  featured: ["Brazil", "Japan", "Italy", "Egypt", "Australia", "Canada"],
  debounce: {
    search: 300,
  },
};

// ===========================
// Estado Global
// ===========================

const state = {
  allCountriesData: [],
  collator: new Intl.Collator("pt-BR", {
    sensitivity: "base",
    ignorePunctuation: true,
  }),
};

// ===========================
// Utilitários Puros
// ===========================

const utils = {
  debounce: (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  },

  formatNumber: (num) => new Intl.NumberFormat("pt-BR").format(num),

  getUrlParam: (param) =>
    new URLSearchParams(window.location.search).get(param) || "",

  getCurrentPage: () => window.location.pathname.split("/").pop(),

  sortByName: (arr, collator) =>
    arr.sort((a, b) =>
      collator.compare(a?.name?.common ?? "", b?.name?.common ?? "")
    ),

  safeExtract: (obj, type) => {
    if (!obj || typeof obj !== "object") return "N/A";

    try {
      const values = Object.values(obj);
      if (!values?.length) return "N/A";

      const first = values[0];
      if (type === "currency" || type === "language") {
        return first?.name || (typeof first === "string" ? first : "N/A");
      }
      return "N/A";
    } catch {
      return "N/A";
    }
  },
};

// ===========================
// API Functions
// ===========================

const api = {
  fetch: async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  },

  countries: {
    getAll: () =>
      api.fetch(
        `${CONFIG.api.restCountries.baseUrl}/all?fields=name,flags,capital,population,continents,languages,currencies`
      ),

    getByRegion: (region) =>
      api.fetch(
        `${CONFIG.api.restCountries.baseUrl}/region/${region}?fields=name,flags,capital,population,continents,languages,currencies`
      ),

    getByName: async (name) => {
      const encoded = encodeURIComponent(name);
      const fields =
        "name,capital,population,languages,currencies,latlng,timezones,flags,borders,region,subregion,continents,translations,cca3,idd,tld,area";

      const tryFetch = async (url) => {
        try {
          const data = await api.fetch(url);
          return data?.length ? data[0] : null;
        } catch (e) {
          if (e.message?.includes("404")) return null;
          throw e;
        }
      };

      const urls = [
        `${CONFIG.api.restCountries.baseUrl}/name/${encoded}?fullText=true&fields=${fields}`,
        `${CONFIG.api.restCountries.baseUrl}/translation/${encoded}?fields=${fields}`,
        `${CONFIG.api.restCountries.baseUrl}/name/${encoded}?fields=${fields}`,
      ];

      for (const url of urls) {
        const result = await tryFetch(url);
        if (result) return result;
      }
      return null;
    },
  },

  weather: {
    get: (lat, lon) =>
      api.fetch(
        `${CONFIG.api.weather.baseUrl}?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&appid=${CONFIG.api.weather.key}`
      ),
  },

  unsplash: {
    getImage: async (query) => {
      try {
        const data = await api.fetch(
          `${CONFIG.api.unsplash.baseUrl}?query=${query}&per_page=1&client_id=${CONFIG.api.unsplash.key}`
        );
        return data.results[0].urls.full;
      } catch {
        return CONFIG.defaults.placeholderImage;
      }
    },
  },
};

// ===========================
// DOM Manipulation
// ===========================

const dom = {
  elements: {},

  init: () => {
    dom.elements = {
      countriesGrid: document.getElementById("countries-grid"),
      continentFilter: document.getElementById("continent-filter"),
      searchCountryInput: document.getElementById("search-country-input"),
      globalSearchInput: document.getElementById("global-search-input"),
      searchButton: document.getElementById("search-button"),
      countriesTitle: document.getElementById("countries-title"),
      featuredContainer: document.getElementById(
        "featured-countries-container"
      ),
      detailsContainer: document.getElementById("country-details-container"),
    };
  },

  setLoading: (element, isLoading) => {
    if (!element) return;
    element.setAttribute("aria-busy", isLoading ? "true" : "false");
    if (isLoading) {
      element.innerHTML = templates.loading.spinner();
    }
  },

  updateTitle: (title, count, searchTerm) => {
    if (!title) return;

    if (!searchTerm) {
      title.textContent = "";
    } else if (count === 0) {
      title.textContent = `Nenhum país encontrado para "${searchTerm}"`;
    } else {
      const plural = count !== 1;
      title.textContent = `${count} país${plural ? "es" : ""} encontrado${
        plural ? "s" : ""
      } para "${searchTerm}"`;
    }
  },
};

// ===========================
// Templates
// ===========================

const templates = {
  loading: {
    spinner: () => `
      <div class="text-center w-100">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Carregando...</span>
        </div>
      </div>`,

    hero: () => `
  <div class="d-flex flex-column align-items-center justify-content-center w-100 p-5 my-5">
    <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
      <span class="visually-hidden" data-translate="Carregando">Carregando...</span>
    </div>
    <p class="mt-3 text-muted fs-5" data-translate="Descobrindo_destino_perfeito">Descobrindo o destino perfeito...</p>
  </div>`,

    featured: () => `
  <div class="loading-hero d-flex flex-column align-items-center justify-content-center py-5">
    <div class="loading-animation">
      <div class="globe-loader"></div>
    </div>
    <h3 class="mt-4 text-primary fw-bold" data-translate="Descobrindo_Destinos_Extraordinarios">Descobrindo Destinos Extraordinários</h3>
    <p class="text-muted fs-5" data-translate="Preparando_experiencias_unicas">Preparando experiências únicas para você...</p>
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
  </style>`,
  },

  error: {
    general: (keyOrMessage = "Erro_geral") => {
      // Verifica se é uma chave conhecida ou uma mensagem fallback
      const message =
        headerButtons.translations[headerButtons.currentLanguage]?.[
          keyOrMessage
        ] || keyOrMessage;
      return `
      <div class="alert alert-danger w-100" role="alert">
        ${message}
      </div>`;
    },
    noResults: () => `
    <div class="col-12">
      <div class="alert alert-info text-center" role="alert">
        <i class="fas fa-search me-2"></i><span data-translate="Nenhum_pais_encontrado">Nenhum país encontrado.</span>
      </div>
    </div>`,
    featured: () => `
    <div class="col-12">
      <div class="premium-error-card text-center p-5 rounded-4">
        <div class="error-icon mb-4">
          <i class="fas fa-globe-americas fa-4x text-muted opacity-50"></i>
        </div>
        <h3 class="text-dark mb-3" data-translate="Ops_algo_deu_errado">Ops! Algo deu errado</h3>
        <p class="text-muted mb-4 fs-5" data-translate="Nao_conseguimos_carregar_os_destinos_em_destaque">Não conseguimos carregar os destinos em destaque no momento.</p>
        <div class="d-flex gap-3 justify-content-center flex-wrap">
          <button class="btn btn-primary btn-lg rounded-pill px-4" onclick="featured.display()">
            <i class="fas fa-redo-alt me-2"></i><span data-translate="Tentar_Novamente">Tentar Novamente</span>
          </button>
          <a href="places.html" class="btn btn-outline-primary btn-lg rounded-pill px-4">
            <i class="fas fa-globe me-2"></i><span data-translate="Ver_Todos_os_Paises">Ver Todos os Países</span>
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
    </style>`,
  },

  countryCard: (country) => {
    const data = extractCountryData(country);
    return `
  <div class="col">
    <div class="card country-card h-100 shadow-sm border-0">
      <div class="position-relative">
        <img src="${
          data.flagUrl
        }" class="country-flag-img w-100" style="height: 150px; object-fit: cover;" alt="Bandeira de ${
      data.name
    }">
        <div class="country-badge-container">
          <span class="country-badge">${data.continent}</span>
        </div>
      </div>
      <div class="card-body p-3 d-flex flex-column">
        <h5 class="card-title fw-bold text-primary mb-3">${data.name}</h5>
        <div class="country-info-grid-icons">
          <div class="info-item-icon">
            <div class="icon-wrapper bg-primary-subtle text-primary">
              <i class="fas fa-building fa-sm"></i>
            </div>
            <div class="info-text">
              <small data-translate="Capital">Capital</small>
              <p class="mb-0 text-truncate" title="${data.capital}">${
      data.capital
    }</p>
            </div>
          </div>
          <div class="info-item-icon">
            <div class="icon-wrapper bg-success-subtle text-success">
              <i class="fas fa-users fa-sm"></i>
            </div>
            <div class="info-text">
              <small data-translate="Populacao">População</small>
              <p class="mb-0">${data.population}</p>
            </div>
          </div>
          <div class="info-item-icon">
            <div class="icon-wrapper bg-info-subtle text-info">
              <i class="fas fa-language fa-sm"></i>
            </div>
            <div class="info-text">
              <small data-translate="Idioma">Idioma</small>
              <p class="mb-0 text-truncate" title="${data.language}">${
      data.language
    }</p>
            </div>
          </div>
          <div class="info-item-icon">
            <div class="icon-wrapper bg-warning-subtle text-warning">
              <i class="fas fa-money-bill-wave fa-sm"></i>
            </div>
            <div class="info-text">
              <small data-translate="Moeda">Moeda</small>
              <p class="mb-0 text-truncate" title="${data.currency}">${
      data.currency
    }</p>
            </div>
          </div>
        </div>
        <a href="country.html?name=${encodeURIComponent(
          data.name
        )}" class="btn btn-primary mt-auto w-100 btn-sm">
          <i class="fas fa-map-marker-alt me-1"></i><span data-translate="Explorar">Explorar</span>
        </a>
      </div>
    </div>
  </div>`;
  },
};

// ===========================
// Helpers para Templates
// ===========================

const extractCountryData = (country) => ({
  name:
    country.translations?.por?.common ||
    country.name?.common ||
    "País desconhecido",
  population: country.population
    ? utils.formatNumber(country.population)
    : "N/A",
  currency: utils.safeExtract(country.currencies, "currency"),
  language: utils.safeExtract(country.languages, "language"),
  continent: country.continents?.[0] || "N/A",
  capital: country.capital?.[0] || "N/A",
  flagUrl:
    country.flags?.svg || country.flags?.png || CONFIG.defaults.placeholderFlag,
});

const createInfoItem = (label, value) => `
  <div class="info-item">
    <small>${label}</small>
    <p class="mb-0 text-truncate" title="${value}">${value}</p>
  </div>`;

// ===========================
// Features - Países
// ===========================

const countries = {
  async loadAll() {
    const { countriesGrid } = dom.elements;
    if (!countriesGrid) return;

    dom.setLoading(countriesGrid, true);

    try {
      const data = await api.countries.getAll();

      if (!data?.length) {
        throw new Error("Dados de países não recebidos");
      }

      utils.sortByName(data, state.collator);
      state.allCountriesData = data;

      countries.display(data);
      console.log(`Carregados ${data.length} países`);
    } catch (error) {
      console.error("Erro ao buscar países:", error);
      countriesGrid.innerHTML = templates.error.general();
    } finally {
      dom.setLoading(countriesGrid, false);
    }
  },

  async loadByRegion(region) {
    const { countriesGrid } = dom.elements;
    if (!countriesGrid) return;

    dom.setLoading(countriesGrid, true);

    try {
      const data = await api.countries.getByRegion(region);

      if (!data?.length) {
        throw new Error("Dados da região não recebidos");
      }

      utils.sortByName(data, state.collator);
      state.allCountriesData = data;

      countries.display(data);
      console.log(`Carregados ${data.length} países da região ${region}`);
    } catch (error) {
      console.error("Erro ao buscar região:", error);
      countriesGrid.innerHTML = templates.error.general();
    } finally {
      dom.setLoading(countriesGrid, false);
    }
  },
  display(countriesList) {
    const { countriesGrid } = dom.elements;
    if (!countriesGrid) return;
    if (!countriesList?.length) {
      countriesGrid.innerHTML = templates.error.noResults();
      // Traduzir a mensagem de "nenhum país encontrado"
      headerButtons.translateElement(countriesGrid);
      return;
    }
    const html = countriesList
      .map((country) => {
        try {
          return templates.countryCard(country);
        } catch (error) {
          console.error("Erro ao processar país:", country, error);
          return "";
        }
      })
      .filter(Boolean)
      .join("");
    countriesGrid.innerHTML =
      html || templates.error.general("Erro ao carregar os países");

    // --- NOVO: Traduzir os cards recém-criados ---
    headerButtons.translateElement(countriesGrid);
  },

  async search(searchTerm = null) {
    if (!state.allCountriesData.length) {
      await countries.loadAll();
      if (!state.allCountriesData.length) return;
    }

    const term = (searchTerm || dom.elements.searchCountryInput?.value || "")
      .toLowerCase()
      .trim();

    if (!term) {
      dom.updateTitle(dom.elements.countriesTitle, 0, "");
      countries.display(state.allCountriesData);
      return;
    }

    const filtered = state.allCountriesData.filter(
      (country) =>
        country.name.common.toLowerCase().includes(term) ||
        country.translations?.por?.common?.toLowerCase().includes(term)
    );

    dom.updateTitle(
      dom.elements.countriesTitle,
      filtered.length,
      searchTerm || term
    );
    countries.display(filtered);
  },
};

// ===========================
// Features - Detalhes do País
// ===========================

const countryDetails = {
  async display() {
    const container = dom.elements.detailsContainer;
    const countryName = utils.getUrlParam("name");

    if (!countryName || !container) return;

    container.innerHTML = templates.loading.hero();

    try {
      const countryData = await api.countries.getByName(countryName);
      if (!countryData) throw new Error("País não encontrado");

      const [weatherData, imageUrl] = await Promise.all([
        countryData.latlng?.length === 2
          ? api.weather
              .get(countryData.latlng[0], countryData.latlng[1])
              .catch(() => null)
          : null,
        api.unsplash.getImage(countryName),
      ]);

      container.innerHTML = countryDetails.buildHTML(
        countryData,
        weatherData,
        imageUrl
      );
      headerButtons.translateElement(container);
      countryDetails.addInteractions();
    } catch (error) {
      console.error("Erro ao carregar detalhes:", error);
      container.innerHTML = templates.error.general(`Erro: ${error.message}`);
    }
  },

  buildHTML(countryData, weatherData, imageUrl) {
    const data = countryDetails.extractData(countryData, weatherData);

    return `
      <div class="container py-4">
        ${countryDetails.buildHeader(countryData, data)}
        ${countryDetails.buildCards(data, weatherData, countryData)}
        ${countryDetails.buildHeroImage(imageUrl, countryData, data)}
        ${countryDetails.buildStats(data)}
      </div>`;
  },

  extractData(countryData, weatherData) {
    return {
      name: countryData.translations?.por?.common || countryData.name.common,
      official:
        countryData.translations?.por?.official || countryData.name.official,
      population: countryData.population
        ? utils.formatNumber(countryData.population)
        : "N/A",
      area: countryData.area
        ? `${utils.formatNumber(countryData.area)} km²`
        : "N/A",
      currency: utils.safeExtract(countryData.currencies, "currency"),
      language: utils.safeExtract(countryData.languages, "language"),
      timezone: countryData.timezones?.[0] || "N/A",
      capital: countryData.capital?.[0] || "N/A",
      region: countryData.region || "N/A",
      subregion: countryData.subregion || "N/A",
      continent: countryData.continents?.[0] || "N/A",
      borders:
        countryData.borders?.map((code) => code.toUpperCase()).join(", ") ||
        "Sem fronteiras terrestres",
      independent:
        countryData.independent !== undefined
          ? countryData.independent
            ? "Sim"
            : "Não"
          : "N/A",
      weather: weatherData
        ? `${Math.round(weatherData.main.temp)}°C, ${
            weatherData.weather[0].description
          }`
        : "N/A",
      phoneCode: `${countryData.idd?.root || ""}${
        countryData.idd?.suffixes?.[0] || "N/A"
      }`,
      internetDomain: countryData.tld?.[0] || "N/A",
      nativeNames:
        Object.values(countryData.name.nativeName || {})
          .map((n) => n.common)
          .join(", ") || "N/A",
    };
  },

  buildHeader(countryData, data) {
    return `
      <div class="row align-items-center mb-5">
        <div class="col-md-8">
          <h1 class="display-4 fw-bold text-primary mb-2">${data.name}</h1>
          <p class="lead text-muted mb-1">${data.official}</p>
          <div class="d-flex flex-wrap gap-2 mt-3">
            <span class="badge bg-info-subtle text-info-emphasis">${
              data.continent
            }</span>
            <span class="badge bg-success-subtle text-success-emphasis">${
              data.region
            }</span>
            <span class="badge bg-warning-subtle text-warning-emphasis">${
              data.subregion
            }</span>
            <span class="badge bg-secondary-subtle text-secondary-emphasis">${
              data.capital
            }</span>
          </div>
        </div>
        <div class="col-md-4 text-center">
          <img src="${countryData.flags.svg || countryData.flags.png}"
               alt="Bandeira de ${data.name}"
               class="img-fluid rounded-4 shadow-sm"
               style="max-height: 180px; object-fit: contain;">
        </div>
      </div>`;
  },

  buildCards(data, weatherData, countryData) {
    return `
      <div class="row g-4 mb-5">
        ${countryDetails.buildInfoCard(data)}
        ${countryDetails.buildWeatherCard(weatherData)}
        ${countryDetails.buildBordersCard(data, countryData)}
      </div>`;
  },

  buildInfoCard(data) {
    const items = [
      { icon: "fa-globe", labelKey: "Continente", value: data.continent },
      { icon: "fa-map-marker-alt", labelKey: "Regiao", value: data.region },
      { icon: "fa-building", labelKey: "Capital", value: data.capital },
      { icon: "fa-users", labelKey: "Populacao", value: data.population },
      { icon: "fa-ruler-combined", labelKey: "Area", value: data.area },
      { icon: "fa-language", labelKey: "Idioma", value: data.language },
      { icon: "fa-money-bill-wave", labelKey: "Moeda", value: data.currency },
      { icon: "fa-clock", labelKey: "Fuso_Horario", value: data.timezone },
      {
        icon: "fa-flag-checkered",
        labelKey: "Independente",
        value: data.independent,
      },
    ];
    return `
    <div class="col-lg-4 col-md-6">
      <div class="card h-100 shadow-sm border-0 rounded-4 transition-card">
        <div class="card-header bg-primary text-white py-3">
          <h5 class="mb-0"><i class="fas fa-info-circle me-2"></i><span data-translate="Informacoes_Essenciais">Informações Essenciais</span></h5>
        </div>
        <div class="card-body">
          <ul class="list-unstyled">
            ${items
              .map(
                (item) => `
              <li class="mb-3">
                <strong><i class="fas ${item.icon} me-2 text-muted"></i><span data-translate="${item.labelKey}">${item.labelKey}</span>:</strong> ${item.value}
              </li>
            `
              )
              .join("")}
          </ul>
        </div>
      </div>
    </div>`;
  },

  buildWeatherCard(weatherData) {
    const content = weatherData
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
        <div class="small text-muted" data-translate="Sensacao">Sensação</div>
        <div class="fw-bold">${Math.round(weatherData.main.feels_like)}°C</div>
      </div>
      <div class="col-6">
        <div class="small text-muted" data-translate="Umidade">Umidade</div>
        <div class="fw-bold">${weatherData.main.humidity}%</div>
      </div>
      <div class="col-6">
        <div class="small text-muted" data-translate="Minima">Mínima</div>
        <div class="fw-bold">${Math.round(weatherData.main.temp_min)}°C</div>
      </div>
      <div class="col-6">
        <div class="small text-muted" data-translate="Maxima">Máxima</div>
        <div class="fw-bold">${Math.round(weatherData.main.temp_max)}°C</div>
      </div>
    </div>
  `
      : `
    <div class="text-center py-5">
      <i class="fas fa-cloud-sun fa-3x text-secondary opacity-50 mb-3"></i>
      <p class="text-muted" data-translate="Dados_climaticos_indisponiveis">Dados climáticos indisponíveis para este local.</p>
    </div>
  `;
    return `
    <div class="col-lg-4 col-md-6">
      <div class="card h-100 shadow-sm border-0 rounded-4 transition-card">
        <div class="card-header bg-success text-white py-3">
          <h5 class="mb-0"><i class="fas fa-cloud-sun me-2"></i><span data-translate="Clima_Atual">Clima Atual</span></h5>
        </div>
        <div class="card-body d-flex flex-column justify-content-center">
          ${content}
        </div>
      </div>
    </div>`;
  },

  buildBordersCard(data, countryData) {
    return `
    <div class="col-lg-4 col-md-12">
      <div class="card h-100 shadow-sm border-0 rounded-4 transition-card">
        <div class="card-header bg-warning text-white py-3">
          <h5 class="mb-0"><i class="fas fa-border-all me-2"></i><span data-translate="Fronteiras_e_Geopolitica">Fronteiras & Geopolítica</span></h5>
        </div>
        <div class="card-body">
          <ul class="list-unstyled">
            <li class="mb-3">
              <strong><i class="fas fa-globe-americas me-2 text-muted"></i><span data-translate="Paises_Vizinhos">Países Vizinhos</span>:</strong><br>
              <span class="text-break">${data.borders}</span>
            </li>
            <li class="mb-3">
              <strong><i class="fas fa-passport me-2 text-muted"></i><span data-translate="Codigo_Telefonico">Código Telefônico</span>:</strong> ${data.phoneCode}
            </li>
            <li class="mb-3">
              <strong><i class="fas fa-tachometer-alt me-2 text-muted"></i><span data-translate="Dominio_de_Internet">Domínio de Internet</span>:</strong> ${data.internetDomain}
            </li>
            <li class="mb-3">
              <strong><i class="fas fa-building-columns me-2 text-muted"></i><span data-translate="Nome_Nativo">Nome Nativo</span>:</strong><br>
              <span class="text-break">${data.nativeNames}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>`;
  },
  buildHeroImage(imageUrl, countryData, data) {
    return `
      <div class="row mb-5">
        <div class="col-12">
          <div class="card border-0 rounded-4 overflow-hidden position-relative shadow-lg">
            <img src="${imageUrl}"
                 alt="Paisagem de ${data.name}"
                 class="img-fluid w-100" style="height: 500px; object-fit: cover;">
            <div class="card-img-overlay d-flex flex-column justify-content-end p-4">
              <div class="bg-dark bg-opacity-75 p-4 rounded-4">
                <h3 class="text-white mb-2">${data.name}</h3>
                <p class="text-white mb-0">${data.capital} • ${data.region} • ${data.continent}</p>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  },

  buildStats(data) {
    const stats = [
      {
        icon: "fa-users",
        title: "População",
        value: data.population,
        color: "primary",
      },
      {
        icon: "fa-ruler-combined",
        title: "Área",
        value: data.area,
        color: "success",
      },
      {
        icon: "fa-language",
        title: "Idioma",
        value: data.language,
        color: "info",
      },
      {
        icon: "fa-money-bill-wave",
        title: "Moeda",
        value: data.currency,
        color: "warning",
      },
    ];

    return `
      <div class="row g-4">
        ${stats
          .map(
            (stat) => `
          <div class="col-md-6 col-lg-3">
            <div class="card text-center shadow-sm border-0 rounded-4 h-100 transition-card">
              <div class="card-body d-flex flex-column justify-content-center">
                <i class="fas ${stat.icon} fa-2x text-${stat.color} mb-3"></i>
                <h5 class="card-title">${stat.title}</h5>
                <p class="card-text fw-bold">${stat.value}</p>
              </div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>`;
  },

  addInteractions() {
    document.querySelectorAll(".transition-card").forEach((card) => {
      card.addEventListener("mouseenter", () =>
        card.classList.add("shadow-lg")
      );
      card.addEventListener("mouseleave", () =>
        card.classList.remove("shadow-lg")
      );
    });
  },
};

// ===========================
// Features - Países em Destaque
// ===========================

const featured = {
  async display() {
    const container = dom.elements.featuredContainer;
    if (!container) return;

    container.innerHTML = templates.loading.featured();

    try {
      const countriesData = await Promise.all(
        CONFIG.featured.map((name) =>
          api.countries.getByName(name).catch(() => null)
        )
      );

      const validCountries = countriesData.filter(Boolean);
      if (!validCountries.length)
        throw new Error("Nenhum país em destaque encontrado");

      const enhancedCountries = await Promise.all(
        validCountries.map(async (country) => {
          const [weather, image] = await Promise.all([
            country.latlng
              ? api.weather
                  .get(country.latlng[0], country.latlng[1])
                  .catch(() => null)
              : null,
            api.unsplash.getImage(country.name.common).catch(() => null),
          ]);
          return { ...country, weather, image };
        })
      );

      container.innerHTML = `<style>${featured.getStyles()}</style><div class="row">${featured.buildHTML(
        enhancedCountries
      )}</div>`;
      headerButtons.translateElement(container);
    } catch (error) {
      console.error("Erro ao buscar países em destaque:", error);
      container.innerHTML = templates.error.featured();
    }
  },

  buildHTML(countries) {
    const cards = countries
      .map((country, i) => featured.buildCard(country, i))
      .join("");
    return `<style>${featured.getStyles()}</style><div class="row">${cards}</div>`;
  },

  buildCard(country, index) {
    const data = featured.extractData(country);
    const gradient =
      featured.getGradients()[index % featured.getGradients().length];

    return `
      <div class="col-lg-4 col-md-6 mb-5">
        <div class="featured-country-premium-card" data-aos="fade-up" data-aos-delay="${
          index * 100
        }">
          <div class="card-hero-section">
            <div class="hero-image-container">
              ${
                data.image
                  ? `<img src="${data.image}" alt="Paisagem de ${data.name}" class="hero-background-image" loading="lazy">`
                  : ""
              }
              <div class="hero-gradient-overlay" style="background: ${gradient}"></div>
              <div class="hero-content">
                <div class="country-flag-premium">
                  <img src="${data.flag}" alt="Bandeira de ${
      data.name
    }" onerror="this.src=\'https://via.placeholder.com/80x60?text=Flag\'">
                </div>
                <h2 class="country-name-hero">${data.name}</h2>
                <div class="location-badges">
                  <span class="location-badge primary">${data.continent}</span>
                  <span class="location-badge secondary">${data.region}</span>
                </div>
              </div>
              ${
                data.weather
                  ? `
                <div class="weather-widget-floating">
                  <div class="weather-temp">${Math.round(
                    data.weather.main.temp
                  )}°</div>
                  <div class="weather-desc">${
                    data.weather.weather[0].description
                  }</div>
                  <div class="weather-icon">
                    <img src="https://openweathermap.org/img/wn/${
                      data.weather.weather[0].icon
                    }@2x.png" alt="Clima" style="width: 40px; height: 40px;">
                  </div>
                </div>`
                  : ""
              }
            </div>
          </div>
          <div class="premium-info-panel">
           <div class="info-stats-grid">
  ${featured.buildStatItem("fa-city", "Capital", data.capital)}
  ${featured.buildStatItem("fa-users", "Populacao", data.population)}
  ${featured.buildStatItem("fa-comments", "Idioma", data.language)}
  ${featured.buildStatItem("fa-coins", "Moeda", data.currency)}
</div>
            <a href="country.html?name=${encodeURIComponent(
              data.name
            )}" class="premium-explore-btn">
              <span class="btn-text"><i class="fas fa-rocket me-2"></i>Explorar ${
                data.name
              }</span>
              <span class="btn-arrow"><i class="fas fa-arrow-right"></i></span>
            </a>
          </div>
        </div>
      </div>`;
  },

  extractData: (country) => ({
    name: country.translations?.por?.common || country.name.common,
    capital: country.capital?.[0] || "N/A",
    population: utils.formatNumber(country.population),
    language: utils.safeExtract(country.languages, "language"),
    currency: utils.safeExtract(country.currencies, "currency"),
    region: country.region || "N/A",
    continent: country.continents?.[0] || "N/A",
    flag: country.flags.svg,
    weather: country.weather,
    image: country.image,
  }),

  buildStatItem: (icon, labelKey, value) => `
  <div class="stat-item">
    <div class="stat-icon"><i class="fas ${icon}"></i></div>
    <div class="stat-content">
      <span class="stat-label" data-translate="${labelKey}">${labelKey}</span>
      <span class="stat-value">${value}</span>
    </div>
  </div>`,

  getGradients: () => [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
  ],

  getStyles: () => `
    .featured-country-premium-card { background: #fff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.1); transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); position: relative; height: 520px; }
    .featured-country-premium-card:hover { transform: translateY(-12px) scale(1.02); box-shadow: 0 30px 80px rgba(0,0,0,0.15); }
    .card-hero-section { height: 280px; position: relative; overflow: hidden; }
    .hero-image-container { position: relative; height: 100%; }
    .hero-background-image { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; }
    .featured-country-premium-card:hover .hero-background-image { transform: scale(1.1); }
    .hero-gradient-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.85; z-index: 1; }
    .hero-content { position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 2; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; color: #fff; padding: 2rem; }
    .country-flag-premium { width: 80px; height: 60px; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3); margin-bottom: 1.5rem; border: 3px solid rgba(255,255,255,0.2); }
    .country-flag-premium img { width: 100%; height: 100%; object-fit: cover; }
    .country-name-hero { font-size: 2.2rem; font-weight: 800; margin-bottom: 1rem; text-shadow: 0 4px 12px rgba(0,0,0,0.3); letter-spacing: -0.5px; }
    .location-badges { display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: center; }
    .location-badge { padding: 0.5rem 1.2rem; border-radius: 50px; font-weight: 600; font-size: 0.85rem; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); }
    .location-badge.primary { background: rgba(255,255,255,0.25); color: #fff; }
    .location-badge.secondary { background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.9); }
    .weather-widget-floating { position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.95); backdrop-filter: blur(15px); border-radius: 16px; padding: 1rem; text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,0.1); z-index: 3; min-width: 100px; }
    .weather-temp { font-size: 1.8rem; font-weight: 800; color: #2d3748; line-height: 1; }
    .weather-desc { font-size: 0.75rem; color: #718096; text-transform: capitalize; margin: 0.25rem 0; font-weight: 500; }
    .weather-icon { margin-top: -0.5rem; }
    .premium-info-panel { padding: 2rem; background: linear-gradient(145deg, #fff 0%, #f8fafc 100%); height: 240px; display: flex; flex-direction: column; justify-content: space-between; }
    .info-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
    .stat-item { display: flex; align-items: center; gap: 0.75rem; }
    .stat-icon { width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1rem; flex-shrink: 0; }
    .stat-content { flex: 1; min-width: 0; }
    .stat-label { display: block; font-size: 0.75rem; color: #718096; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem; }
    .stat-value { display: block; font-size: 0.95rem; color: #2d3748; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .premium-explore-btn { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 1rem 1.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; text-decoration: none; border-radius: 16px; font-weight: 700; font-size: 1rem; transition: all 0.3s ease; position: relative; overflow: hidden; }
    .premium-explore-btn::before { content: \'\'; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); transition: left 0.6s ease; }
    .premium-explore-btn:hover::before { left: 100%; }
    .premium-explore-btn:hover { color: #fff; transform: translateY(-2px); box-shadow: 0 12px 36px rgba(102, 126, 234, 0.4); }
    .btn-arrow { width: 32px; height: 32px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: transform 0.3s ease; }
    .premium-explore-btn:hover .btn-arrow { transform: translateX(4px); }
    @media (max-width: 768px) { .featured-country-premium-card { height: auto; } .card-hero-section { height: 220px; } .country-name-hero { font-size: 1.8rem; } .info-stats-grid { grid-template-columns: 1fr; gap: 1rem; } .premium-info-panel { height: auto; padding: 1.5rem; } }
  `,
};

// ===========================
// Gerenciador de Páginas
// ===========================

const pageManager = {
  init() {
    document.addEventListener("DOMContentLoaded", () => {
      dom.init();
      pageManager.route();
      pageManager.addGlobalListeners();
    });
  },

  route() {
    const page = utils.getCurrentPage();
    switch (page) {
      case "index.html":
      case "intro.html":
      case "":
        countries.loadAll();
        featured.display();
        break;
      case "places.html":
        countries.loadAll();
        break;
      case "country.html":
        countryDetails.display();
        break;
    }
  },

  addGlobalListeners() {
    const {
      searchCountryInput,
      globalSearchInput,
      searchButton,
      continentFilter,
    } = dom.elements;

    if (searchCountryInput) {
      const debouncedSearch = utils.debounce(
        () => countries.search(),
        CONFIG.debounce.search
      );
      searchCountryInput.addEventListener("input", debouncedSearch);
    }

    if (globalSearchInput && searchButton) {
      const handleGlobalSearch = () => {
        const searchTerm = globalSearchInput.value.trim();
        if (searchTerm) {
          window.location.href = `places.html?search=${encodeURIComponent(
            searchTerm
          )}`;
        }
      };
      searchButton.addEventListener("click", handleGlobalSearch);
      globalSearchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleGlobalSearch();
      });
    }

    if (continentFilter) {
      continentFilter.addEventListener("change", () => {
        const region = continentFilter.value;
        region ? countries.loadByRegion(region) : countries.loadAll();
      });
    }

    const searchParam = utils.getUrlParam("search");
    if (searchParam && utils.getCurrentPage() === "places.html") {
      if (searchCountryInput) searchCountryInput.value = searchParam;
      countries.search(searchParam);
    }
  },
};

// ===========================
// Inicialização
// ===========================

pageManager.init();

// ===========================
// Header Buttons Functionality - Versão Completa
// ===========================

const headerButtons = {
  translations: {
    "pt-br": {
      Titulo_Site: "NoMap",
      Nome_Site: "NoMap",
      Placeholder_Pesquisar: "Pesquisar...",
      Pagina_Inicial: "Página Inicial",
      Paises_em_Destaque_Nav: "Países em Destaque",
      Todos_os_Paises_Nav: "Todos os Países",
      Quem_Somos_Nav: "Quem Somos",
      Nossa_Missao_Nav: "Nossa Missão",
      Descubra_o_Mundo: "Descubra o Mundo",
      Seu_guia_completo_para_explorar_destinos_incriveis_sem_fronteiras:
        "Seu guia completo para explorar destinos incríveis sem fronteiras.",
      Explorar_Paises_Btn: "Explorar Países",
      Ver_Destaques_Btn: "Ver Destaques",
      Comece_Sua_Jornada: "Comece Sua Jornada",
      Escolha_o_que_deseja_explorar: "Escolha o que deseja explorar",
      Paises_em_Destaque_Card: "Países em Destaque",
      Descubra_os_destinos_mais_recomendados:
        "Descubra os destinos mais recomendados pelos nossos especialistas.",
      Todos_os_Paises_Card: "Todos os Países",
      Explore_nossa_base_completa:
        "Explore nossa base completa com informações de todos os destinos.",
      Quem_Somos_Card: "Quem Somos",
      Conheca_nossa_equipe:
        "Conheça nossa equipe apaixonada por viagens e tecnologia.",
      Nossa_Missao_Card: "Nossa Missão",
      Descubra_nossa_visao:
        "Descubra nossa visão para o futuro dos guias de viagem.",
      Explorar: "Explorar",
      Ver_Todos: "Ver Todos",
      Conhecer: "Conhecer",
      Nossa_Visao: "Nossa Visão",
      Por_Que_Escolher_o_NoMap: "Por Que Escolher o NoMap?",
      A_revolucao_no_jeito_de_planejar_suas_viagens:
        "A revolução no jeito de planejar suas viagens",
      Informacoes_Completas: "Informações Completas",
      Tudo_em_Um_So_Lugar: "Tudo em Um Só Lugar",
      Cansado_de_procurar_informacoes:
        "Cansado de procurar informações em vários sites diferentes? O NoMap reúne tudo o que você precisa saber sobre um destino em uma única plataforma intuitiva.",
      Dados_atualizados_em_tempo_real: "Dados atualizados em tempo real",
      Informacoes_culturais_e_praticas: "Informações culturais e práticas",
      Clima_atual_e_previsoes: "Clima atual e previsões",
      Imagens_inspiradoras: "Imagens inspiradoras",
      Comunidade_de_Viajantes: "Comunidade de Viajantes",
      Feito_por_Viajantes_para_Viajantes: "Feito por Viajantes, para Viajantes",
      Nosso_time_e_composto:
        "Nosso time é composto por apaixonados por viagens que entendem as necessidades reais de quem está planejando uma aventura pelo mundo.",
      Experiencia_Autentica: "Experiência Autêntica",
      Dicas_baseadas_em_experiencias_reais:
        "Dicas baseadas em experiências reais",
      Inovacao_Constante: "Inovação Constante",
      Sempre_buscando_melhorias: "Sempre buscando melhorias para você",
      Pronto_para_Comecar_sua_Proxima_Aventura:
        "Pronto para Começar sua Próxima Aventura?",
      Explore_nosso_guia_completo:
        "Explore nosso guia completo e descubra destinos incríveis",
      Comecar_a_Explorar: "Começar a Explorar",
      Direitos_Reservados: "2025 NoMap. Todos os direitos reservados.",
      Configuracoes_do_Site: "Configurações do Site",
      Modo_Escuro: "Modo Escuro",
      Ative_o_tema_escuro_para_uma_melhor_experiencia_noturna:
        "Ative o tema escuro para uma melhor experiência noturna",
      Idioma: "Idioma",
      Escolha_o_idioma_da_interface: "Escolha o idioma da interface",
      Animacoes: "Animações",
      Controle_as_animacoes_da_interface: "Controle as animações da interface",
      Notificacoes: "Notificações",
      Receba_notificacoes_sobre_novos_destinos:
        "Receba notificações sobre novos destinos",
      Cancelar: "Cancelar",
      Salvar_Configuracoes: "Salvar Configurações",
      // --- TRADUÇÕES PARA MISSION.HTML ---
      Titulo_Nossa_Missao: "NoMap - O que Buscamos",
      Titulo_O_que_Buscamos: "O que Buscamos",
      Subtitulo_Visao_Transformadora:
        "Nossa visão transformadora para o futuro das viagens e da exploração mundial.",
      Nossa_Visao: "Nossa Visão",
      Transformar_Forma_Exploracao:
        "Transformar a Forma Como o Mundo é Explorado",
      Nao_somos_apenas_guia:
        "Não somos apenas um guia de viagens - somos uma plataforma que acredita no poder transformador da exploração. Imaginamos um mundo onde as barreiras para descobrir novos lugares sejam eliminadas, onde cada pessoa possa planejar sua aventura com confiança e inspiração.",
      Objetivo_referencia_global:
        "Nosso objetivo é ser a referência global em informações de viagem, conectando exploradores a destinos de maneira autêntica, acessível e profundamente enriquecedora.",
      Nossos_Pilares_Fundamentais: "Nossos Pilares Fundamentais",
      Principios_que_guam_jornada:
        "Princípios que guiam cada passo da nossa jornada",
      Pilar_Acessibilidade_Universal: "Acessibilidade Universal",
      Acreditamos_explorar_mundo:
        "Acreditamos que explorar o mundo deve ser possível para todos. Trabalhamos para democratizar o acesso à informação de viagem, independentemente de origem ou condição.",
      Pilar_Inovacao_Continua: "Inovação Contínua",
      Mundo_muda_rapidamente:
        "O mundo muda rapidamente, e nós também. Estamos constantemente evoluindo nossa plataforma com as mais recentes tecnologias para oferecer a melhor experiência possível aos viajantes.",
      Pilar_Impacto_Positivo: "Impacto Positivo",
      Queremos_contribuir_turismo:
        "Queremos que nossas ações contribuam para um turismo mais responsável e sustentável. Promovemos práticas que respeitam culturas locais e preservam os destinos para as futuras gerações.",
      Compromisso_com_Futuro: "Nosso Compromisso com o Futuro",
      Metas_trajetoria_crescimento:
        "Metas que definem nossa trajetória de crescimento",
      Meta_Comunidade_Global: "Comunidade Global de Viajantes",
      Desenvolvendo_funcionalidades_compartilhar:
        "Estamos desenvolvendo funcionalidades que permitirão aos usuários compartilhar experiências, criar roteiros personalizados e se conectar com outros exploradores ao redor do mundo.",
      Meta_IA_Personalizada: "Inteligência Artificial Personalizada",
      Planejamos_integrar_IA:
        "Planejamos integrar IA para oferecer recomendações hiperpersonalizadas com base no perfil, orçamento e interesses de cada viajante, tornando o planejamento mais inteligente e eficiente.",
      Meta_Sustentabilidade: "Sustentabilidade e Responsabilidade",
      Vamos_destacar_praticas_sustentaveis:
        "Vamos destacar destinos e práticas que promovem o turismo sustentável, ajudando os viajantes a fazerem escolhas conscientes que beneficiem comunidades locais e o meio ambiente.",
      Meta_Experiencias_Imersivas: "Experiências Imersivas",
      Explorando_tecnologias_AR_VR:
        'Estamos explorando tecnologias como realidade aumentada e virtual para oferecer previews imersivos dos destinos, permitindo que os viajantes "visitem" lugares antes de embarcar.',
      Junte_se_a_Nossa_Missao: "Junte-se à Nossa Missão",
      Faca_parte_comunidade_redefinindo:
        "Faça parte da comunidade que está redefinindo a forma como o mundo é explorado",
      Explorar_Destinos_Btn: "Explorar Destinos",
      Conhecer_Equipe_Btn: "Conhecer a Equipe",
      // --- TRADUÇÕES PARA ABOUT.HTML ---
      Titulo_Quem_Somos: "NoMap - Quem Somos",
      Quem_Somos_Titulo: "Quem Somos",
      A_equipe_apaixonada_por_viagens:
        "A equipe apaixonada por viagens e tecnologia que transforma descobertas em experiências.",
      Nossa_Origem: "Nossa Origem",
      Da_Frustracao_a_Inspiracao: "Da Frustração à Inspiração",
      NoMap_nasceu_de_uma_necessidade_real:
        "O NoMap nasceu de uma necessidade real: a frustração de buscar informações de viagem em dezenas de sites diferentes, sem encontrar tudo em um só lugar. O que começou como um projeto pessoal para resolver nosso próprio problema, rapidamente se transformou em uma missão maior.",
      Somos_viajantes_desenvolvedores_e_designers:
        "Somos viajantes, desenvolvedores e designers que compartilham a mesma crença:",
      descobrir_o_mundo_deve_ser_simples:
        "descobrir o mundo deve ser simples, inspirador e acessível para todos",
      Nossa_Filosofia: "Nossa Filosofia",
      Principios_que_guam_cada_decisao:
        "Princípios que guiam cada decisão que tomamos",
      Paixao_Autentica: "Paixão Autêntica",
      Somos_verdadeiros_apaixonados_por_viagens:
        "Somos verdadeiros apaixonados por viagens. Cada recurso que desenvolvemos nasce da nossa própria experiência como exploradores do mundo.",
      Inovacao_Consciente: "Inovação Consciente",
      Acreditamos_que_tecnologia_deve_simplificar:
        "Acreditamos que tecnologia deve simplificar, não complicar. Cada inovação é pensada para agregar valor real à sua experiência de viagem.",
      Conexao_Global: "Conexão Global",
      Queremos_conectar_pessoas_a_lugares:
        "Queremos conectar pessoas a lugares, culturas e experiências. O mundo é grande demais para ser explorado sozinho.",
      Nossa_Equipe: "Nossa Equipe",
      Profissionais_apaixonados_por_criar_experiencias:
        "Profissionais apaixonados por criar experiências extraordinárias",
      Bruno_Nome: "Bruno",
      Bruno_Cargo: "Testador",
      Bruno_Descricao:
        "Guardião da qualidade e experiência do usuário. Acredita que um produto excelente nasce da atenção aos detalhes.",
      Guilherme_Nome: "Guilherme",
      Guilherme_Cargo: "Desenvolvedor Sênior",
      Guilherme_Descricao:
        "Arquiteto da solução e mentor da equipe. Transforma desafios complexos em código elegante e eficiente.",
      Felipe_Nome: "Felipe",
      Felipe_Cargo: "Desenvolvedor Júnior",
      Felipe_Descricao:
        "Entusiasta da tecnologia e implementador de soluções. Acredita que cada linha de código contribui para uma experiência melhor.",
      Faca_Parte_da_Nossa_Historia: "Faça Parte da Nossa História",
      Junte_se_a_milhares_de_viajantes:
        "Junte-se a milhares de viajantes que já descobriram o mundo com o NoMap",
      // --- TRADUÇÕES PARA INTRO.HTML ---
      Titulo_Paises_em_Destaque: "NoMap - Países em Destaque",
      Titulo_Paises_em_Destaque_Secao: "Países em Destaque",
      Ver_Todos_os_Paises_Btn: "Ver Todos os Países",
      Sobre_o_NoMap_Btn: "Sobre o NoMap",
      Nenhum_pais_encontrado: "Nenhum país encontrado.",
      Erro_geral:
        "Não foi possível carregar os dados. Tente novamente mais tarde.",
      // --- TRADUÇÕES PARA CONTEÚDO DINÂMICO (CARDS, ERROS, ETC) ---

      // Mensagens de Erro e Carregamento
      Nenhum_pais_encontrado: "Nenhum país encontrado.",
      Erro_ao_carregar_paises: "Erro ao carregar os países.",
      Erro_ao_carregar_detalhes: "Erro ao carregar detalhes do país.",
      Carregando: "Carregando...",
      Descobrindo_destino_perfeito: "Descobrindo o destino perfeito...",
      Descobrindo_Destinos_Extraordinarios:
        "Descobrindo Destinos Extraordinários",
      Preparando_experiencias_unicas:
        "Preparando experiências únicas para você...",
      Ops_algo_deu_errado: "Ops! Algo deu errado",
      Nao_conseguimos_carregar_os_destinos_em_destaque:
        "Não conseguimos carregar os destinos em destaque no momento.",
      Tentar_Novamente: "Tentar Novamente",
      Ver_Todos_os_Paises: "Ver Todos os Países",

      // Labels de Informações (usados em cards e detalhes)
      Continente: "Continente",
      Regiao: "Região",
      Subregiao: "Sub-região",
      Capital: "Capital",
      Populacao: "População",
      Area: "Área",
      Idioma: "Idioma",
      Moeda: "Moeda",
      Fuso_Horario: "Fuso Horário",
      Independente: "Independente",
      Clima_Atual: "Clima Atual",
      Fronteiras_e_Geopolitica: "Fronteiras & Geopolítica",
      Paises_Vizinhos: "Países Vizinhos",
      Codigo_Telefonico: "Código Telefônico",
      Dominio_de_Internet: "Domínio de Internet",
      Nome_Nativo: "Nome Nativo",
      Sensacao: "Sensação",
      Umidade: "Umidade",
      Minima: "Mínima",
      Maxima: "Máxima",
      Dados_climaticos_indisponiveis:
        "Dados climáticos indisponíveis para este local.",

      // Valores Booleanos e Fallbacks
      Sim: "Sim",
      Nao: "Não",
      "N/A": "N/A",
      Sem_fronteiras_terrestres: "Sem fronteiras terrestres",

      // Botões e Ações
      Explorar: "Explorar",
      Nenhum_pais_encontrado: "Nenhum país encontrado.",
      Erro_ao_carregar_paises: "Erro ao carregar os países.",
      Erro_ao_carregar_detalhes: "Erro ao carregar detalhes do país.",
      Carregando: "Carregando...",
      Descobrindo_destino_perfeito: "Descobrindo o destino perfeito...",
      Descobrindo_Destinos_Extraordinarios:
        "Descobrindo Destinos Extraordinários",
      Preparando_experiencias_unicas:
        "Preparando experiências únicas para você...",
      Ops_algo_deu_errado: "Ops! Algo deu errado",
      Nao_conseguimos_carregar_os_destinos_em_destaque:
        "Não conseguimos carregar os destinos em destaque no momento.",
      Tentar_Novamente: "Tentar Novamente",
      Ver_Todos_os_Paises: "Ver Todos os Países",
      Continente: "Continente",
      Regiao: "Região",
      Subregiao: "Sub-região",
      Capital: "Capital",
      Populacao: "População",
      Area: "Área",
      Idioma: "Idioma",
      Moeda: "Moeda",
      Fuso_Horario: "Fuso Horário",
      Independente: "Independente",
      Clima_Atual: "Clima Atual",
      Fronteiras_e_Geopolitica: "Fronteiras & Geopolítica",
      Paises_Vizinhos: "Países Vizinhos",
      Codigo_Telefonico: "Código Telefônico",
      Dominio_de_Internet: "Domínio de Internet",
      Nome_Nativo: "Nome Nativo",
      Sensacao: "Sensação",
      Umidade: "Umidade",
      Minima: "Mínima",
      Maxima: "Máxima",
      Dados_climaticos_indisponiveis:
        "Dados climáticos indisponíveis para este local.",
      Sim: "Sim",
      Nao: "Não",
      "N/A": "N/A",
      Sem_fronteiras_terrestres: "Sem fronteiras terrestres",
      Explorar: "Explorar",
    },
    en: {
      // --- TRADUÇÕES PARA INDEX.HTML (EN) ---
      Titulo_Site: "NoMap",
      Nome_Site: "NoMap",
      Placeholder_Pesquisar: "Search...",
      Pagina_Inicial: "Home",
      Paises_em_Destaque_Nav: "Featured Countries",
      Todos_os_Paises_Nav: "All Countries",
      Quem_Somos_Nav: "About Us",
      Nossa_Missao_Nav: "Our Mission",
      Descubra_o_Mundo: "Discover the World",
      Seu_guia_completo_para_explorar_destinos_incriveis_sem_fronteiras:
        "Your complete guide to explore incredible destinations without borders.",
      Explorar_Paises_Btn: "Explore Countries",
      Ver_Destaques_Btn: "See Highlights",
      Comece_Sua_Jornada: "Start Your Journey",
      Escolha_o_que_deseja_explorar: "Choose what you want to explore",
      Paises_em_Destaque_Card: "Featured Countries",
      Descubra_os_destinos_mais_recomendados:
        "Discover the destinations most recommended by our experts.",
      Todos_os_Paises_Card: "All Countries",
      Explore_nossa_base_completa:
        "Explore our complete database with information on all destinations.",
      Quem_Somos_Card: "About Us",
      Conheca_nossa_equipe:
        "Meet our team passionate about travel and technology.",
      Nossa_Missao_Card: "Our Mission",
      Descubra_nossa_visao:
        "Discover our vision for the future of travel guides.",
      Explorar: "Explore",
      Ver_Todos: "View All",
      Conhecer: "Meet Us",
      Nossa_Visao: "Our Vision",
      Por_Que_Escolher_o_NoMap: "Why Choose NoMap?",
      A_revolucao_no_jeito_de_planejar_suas_viagens:
        "The revolution in travel planning",
      Informacoes_Completas: "Complete Information",
      Tudo_em_Um_So_Lugar: "All in One Place",
      Cansado_de_procurar_informacoes:
        "Tired of searching for information on different websites? NoMap brings together everything you need to know about a destination in a single intuitive platform.",
      Dados_atualizados_em_tempo_real: "Real-time updated data",
      Informacoes_culturais_e_praticas: "Cultural and practical information",
      Clima_atual_e_previsoes: "Current weather and forecasts",
      Imagens_inspiradoras: "Inspiring images",
      Comunidade_de_Viajantes: "Traveler Community",
      Feito_por_Viajantes_para_Viajantes: "Made by Travelers, for Travelers",
      Nosso_time_e_composto:
        "Our team is made up of travel enthusiasts who understand the real needs of those planning an adventure around the world.",
      Experiencia_Autentica: "Authentic Experience",
      Dicas_baseadas_em_experiencias_reais: "Tips based on real experiences",
      Inovacao_Constante: "Constant Innovation",
      Sempre_buscando_melhorias: "Always seeking improvements for you",
      Pronto_para_Comecar_sua_Proxima_Aventura:
        "Ready to Start Your Next Adventure?",
      Explore_nosso_guia_completo:
        "Explore our complete guide and discover incredible destinations",
      Comecar_a_Explorar: "Start Exploring",
      Direitos_Reservados: "2025 NoMap. All rights reserved.",
      Configuracoes_do_Site: "Site Settings",
      Modo_Escuro: "Dark Mode",
      Ative_o_tema_escuro_para_uma_melhor_experiencia_noturna:
        "Enable dark theme for a better nighttime experience",
      Idioma: "Language",
      Escolha_o_idioma_da_interface: "Choose interface language",
      Animacoes: "Animations",
      Controle_as_animacoes_da_interface: "Control interface animations",
      Notificacoes: "Notifications",
      Receba_notificacoes_sobre_novos_destinos:
        "Receive notifications about new destinations",
      Cancelar: "Cancel",
      Salvar_Configuracoes: "Save Settings",
      // --- TRADUÇÕES PARA INTRO.HTML (EN) ---
      Titulo_Paises_em_Destaque: "NoMap - Featured Countries",
      Titulo_Paises_em_Destaque_Secao: "Featured Countries",
      Ver_Todos_os_Paises_Btn: "View All Countries",
      Sobre_o_NoMap_Btn: "About NoMap",
      // --- TRADUÇÕES PARA MISSION.HTML (EN) ---
      Titulo_Nossa_Missao: "NoMap - What We Seek",
      Titulo_O_que_Buscamos: "What We Seek",
      Subtitulo_Visao_Transformadora:
        "Our transformative vision for the future of travel and global exploration.",
      Nossa_Visao: "Our Vision",
      Transformar_Forma_Exploracao:
        "Transforming the Way the World is Explored",
      Nao_somos_apenas_guia:
        "We are not just a travel guide - we are a platform that believes in the transformative power of exploration. We envision a world where barriers to discovering new places are eliminated, where everyone can plan their adventure with confidence and inspiration.",
      Objetivo_referencia_global:
        "Our goal is to be the global reference in travel information, connecting explorers to destinations in an authentic, accessible, and deeply enriching way.",
      Nossos_Pilares_Fundamentais: "Our Core Pillars",
      Principios_que_guam_jornada:
        "Principles that guide every step of our journey",
      Pilar_Acessibilidade_Universal: "Universal Accessibility",
      Acreditamos_explorar_mundo:
        "We believe exploring the world should be possible for everyone. We work to democratize access to travel information, regardless of origin or condition.",
      Pilar_Inovacao_Continua: "Continuous Innovation",
      Mundo_muda_rapidamente:
        "The world changes rapidly, and so do we. We are constantly evolving our platform with the latest technologies to offer travelers the best possible experience.",
      Pilar_Impacto_Positivo: "Positive Impact",
      Queremos_contribuir_turismo:
        "We want our actions to contribute to more responsible and sustainable tourism. We promote practices that respect local cultures and preserve destinations for future generations.",
      Compromisso_com_Futuro: "Our Commitment to the Future",
      Metas_trajetoria_crescimento: "Goals that define our growth trajectory",
      Meta_Comunidade_Global: "Global Traveler Community",
      Desenvolvendo_funcionalidades_compartilhar:
        "We are developing features that will allow users to share experiences, create personalized itineraries, and connect with other explorers around the world.",
      Meta_IA_Personalizada: "Personalized Artificial Intelligence",
      Planejamos_integrar_IA:
        "We plan to integrate AI to offer hyper-personalized recommendations based on each traveler's profile, budget, and interests, making planning smarter and more efficient.",
      Meta_Sustentabilidade: "Sustainability and Responsibility",
      Vamos_destacar_praticas_sustentaveis:
        "We will highlight destinations and practices that promote sustainable tourism, helping travelers make conscious choices that benefit local communities and the environment.",
      Meta_Experiencias_Imersivas: "Immersive Experiences",
      Explorando_tecnologias_AR_VR:
        'We are exploring technologies like augmented and virtual reality to offer immersive previews of destinations, allowing travelers to "visit" places before they embark.',
      Junte_se_a_Nossa_Missao: "Join Our Mission",
      Faca_parte_comunidade_redefinindo:
        "Be part of the community that is redefining how the world is explored",
      Explorar_Destinos_Btn: "Explore Destinations",
      Conhecer_Equipe_Btn: "Meet the Team",
      // --- TRADUÇÕES PARA ABOUT.HTML (EN) ---
      Titulo_Quem_Somos: "NoMap - About Us",
      Quem_Somos_Titulo: "About Us",
      A_equipe_apaixonada_por_viagens:
        "The passionate team of travelers and technologists who turn discoveries into experiences.",
      Nossa_Origem: "Our Origin",
      Da_Frustracao_a_Inspiracao: "From Frustration to Inspiration",
      NoMap_nasceu_de_uma_necessidade_real:
        "NoMap was born from a real need: the frustration of searching for travel information across dozens of different websites without finding everything in one place. What started as a personal project to solve our own problem quickly became a larger mission.",
      Somos_viajantes_desenvolvedores_e_designers:
        "We are travelers, developers, and designers who share the same belief:",
      descobrir_o_mundo_deve_ser_simples:
        "discovering the world should be simple, inspiring, and accessible to everyone",
      Nossa_Filosofia: "Our Philosophy",
      Principios_que_guam_cada_decisao:
        "Principles that guide every decision we make",
      Paixao_Autentica: "Authentic Passion",
      Somos_verdadeiros_apaixonados_por_viagens:
        "We are true travel enthusiasts. Every feature we develop stems from our own experience as world explorers.",
      Inovacao_Consciente: "Conscious Innovation",
      Acreditamos_que_tecnologia_deve_simplificar:
        "We believe technology should simplify, not complicate. Every innovation is designed to add real value to your travel experience.",
      Conexao_Global: "Global Connection",
      Queremos_conectar_pessoas_a_lugares:
        "We want to connect people to places, cultures, and experiences. The world is too big to be explored alone.",
      Nossa_Equipe: "Our Team",
      Profissionais_apaixonados_por_criar_experiencias:
        "Passionate professionals dedicated to creating extraordinary experiences",
      Bruno_Nome: "Bruno",
      Bruno_Cargo: "Tester",
      Bruno_Descricao:
        "Guardian of quality and user experience. Believes an excellent product is born from attention to detail.",
      Guilherme_Nome: "Guilherme",
      Guilherme_Cargo: "Senior Developer",
      Guilherme_Descricao:
        "Solution architect and team mentor. Transforms complex challenges into elegant and efficient code.",
      Felipe_Nome: "Felipe",
      Felipe_Cargo: "Junior Developer",
      Felipe_Descricao:
        "Technology enthusiast and solution implementer. Believes every line of code contributes to a better experience.",
      Faca_Parte_da_Nossa_Historia: "Be Part of Our Story",
      Junte_se_a_milhares_de_viajantes:
        "Join thousands of travelers who have already discovered the world with NoMap",
      Nenhum_pais_encontrado: "No countries found.",
      Erro_geral: "Failed to load data. Please try again later.",
      Nenhum_pais_encontrado: "No countries found.",
      Erro_ao_carregar_paises: "Error loading countries.",
      Erro_ao_carregar_detalhes: "Error loading country details.",
      Carregando: "Loading...",
      Descobrindo_destino_perfeito: "Discovering the perfect destination...",
      Descobrindo_Destinos_Extraordinarios:
        "Discovering Extraordinary Destinations",
      Preparando_experiencias_unicas: "Preparing unique experiences for you...",
      Ops_algo_deu_errado: "Oops! Something went wrong",
      Nao_conseguimos_carregar_os_destinos_em_destaque:
        "We couldn't load the featured destinations at the moment.",
      Tentar_Novamente: "Try Again",
      Ver_Todos_os_Paises: "View All Countries",
      Continente: "Continent",
      Regiao: "Region",
      Subregiao: "Subregion",
      Capital: "Capital",
      Populacao: "Population",
      Area: "Area",
      Idioma: "Language",
      Moeda: "Currency",
      Fuso_Horario: "Timezone",
      Independente: "Independent",
      Clima_Atual: "Current Weather",
      Fronteiras_e_Geopolitica: "Borders & Geopolitics",
      Paises_Vizinhos: "Neighboring Countries",
      Codigo_Telefonico: "Phone Code",
      Dominio_de_Internet: "Internet Domain",
      Nome_Nativo: "Native Name",
      Sensacao: "Feels Like",
      Umidade: "Humidity",
      Minima: "Minimum",
      Maxima: "Maximum",
      Dados_climaticos_indisponiveis:
        "Weather data unavailable for this location.",
      Sim: "Yes",
      Nao: "No",
      "N/A": "N/A",
      Sem_fronteiras_terrestres: "No land borders",
      Explorar: "Explore",
    },
    es: {
      // --- TRADUÇÕES PARA INDEX.HTML (ES) ---
      Titulo_Site: "NoMap",
      Nome_Site: "NoMap",
      Placeholder_Pesquisar: "Buscar...",
      Pagina_Inicial: "Inicio",
      Paises_em_Destaque_Nav: "Países Destacados",
      Todos_os_Paises_Nav: "Todos los Países",
      Quem_Somos_Nav: "Quiénes Somos",
      Nossa_Missao_Nav: "Nuestra Misión",
      Descubra_o_Mundo: "Descubre el Mundo",
      Seu_guia_completo_para_explorar_destinos_incriveis_sem_fronteiras:
        "Tu guía completa para explorar destinos increíbles sin fronteras.",
      Explorar_Paises_Btn: "Explorar Países",
      Ver_Destaques_Btn: "Ver Destacados",
      Comece_Sua_Jornada: "Comienza tu Viaje",
      Escolha_o_que_deseja_explorar: "Elige lo que quieres explorar",
      Paises_em_Destaque_Card: "Países Destacados",
      Descubra_os_destinos_mais_recomendados:
        "Descubre los destinos más recomendados por nuestros expertos.",
      Todos_os_Paises_Card: "Todos los Países",
      Explore_nossa_base_completa:
        "Explora nuestra base completa con información de todos los destinos.",
      Quem_Somos_Card: "Quiénes Somos",
      Conheca_nossa_equipe:
        "Conoce a nuestro equipo apasionado por los viajes y la tecnología.",
      Nossa_Missao_Card: "Nuestra Misión",
      Descubra_nossa_visao:
        "Descubre nuestra visión para el futuro de las guías de viaje.",
      Explorar: "Explorar",
      Ver_Todos: "Ver Todos",
      Conhecer: "Conocer",
      Nossa_Visao: "Nuestra Visión",
      Por_Que_Escolher_o_NoMap: "¿Por qué elegir NoMap?",
      A_revolucao_no_jeito_de_planejar_suas_viagens:
        "La revolución en la planificación de viajes",
      Informacoes_Completas: "Información Completa",
      Tudo_em_Um_So_Lugar: "Todo en un Solo Lugar",
      Cansado_de_procurar_informacoes:
        "¿Cansado de buscar información en diferentes sitios web? NoMap reúne todo lo que necesitas saber sobre un destino en una única plataforma intuitiva.",
      Dados_atualizados_em_tempo_real: "Datos actualizados en tiempo real",
      Informacoes_culturais_e_praticas: "Información cultural y práctica",
      Clima_atual_e_previsoes: "Clima actual y previsiones",
      Imagens_inspiradoras: "Imágenes inspiradoras",
      Comunidade_de_Viajantes: "Comunidad de Viajeros",
      Feito_por_Viajantes_para_Viajantes: "Hecho por Viajeros, para Viajeros",
      Nosso_time_e_composto:
        "Nuestro equipo está compuesto por apasionados de los viajes que entienden las necesidades reales de quienes planean una aventura por el mundo.",
      Experiencia_Autentica: "Experiencia Auténtica",
      Dicas_baseadas_em_experiencias_reais:
        "Consejos basados en experiencias reales",
      Inovacao_Constante: "Innovación Constante",
      Sempre_buscando_melhorias: "Siempre buscando mejoras para ti",
      Pronto_para_Comecar_sua_Proxima_Aventura:
        "¿Listo para comenzar tu próxima aventura?",
      Explore_nosso_guia_completo:
        "Explora nuestra guía completa y descubre destinos increíbles",
      Comecar_a_Explorar: "Comenzar a Explorar",
      Direitos_Reservados: "2025 NoMap. Todos los derechos reservados.",
      Configuracoes_do_Site: "Configuración del Sitio",
      Modo_Escuro: "Modo Oscuro",
      Ative_o_tema_escuro_para_uma_melhor_experiencia_noturna:
        "Activa el tema oscuro para una mejor experiencia nocturna",
      Idioma: "Idioma",
      Escolha_o_idioma_da_interface: "Elige el idioma de la interfaz",
      Animacoes: "Animaciones",
      Controle_as_animacoes_da_interface:
        "Controla las animaciones de la interfaz",
      Notificacoes: "Notificaciones",
      Receba_notificacoes_sobre_novos_destinos:
        "Recibe notificaciones sobre nuevos destinos",
      Cancelar: "Cancelar",
      Salvar_Configuracoes: "Guardar Configuración",
      // --- TRADUÇÕES PARA MISSION.HTML (ES) ---
      Titulo_Nossa_Missao: "NoMap - Lo que Buscamos",
      Titulo_O_que_Buscamos: "Lo que Buscamos",
      Subtitulo_Visao_Transformadora:
        "Nuestra visión transformadora para el futuro de los viajes y la exploración mundial.",
      Nossa_Visao: "Nuestra Visión",
      Transformar_Forma_Exploracao:
        "Transformar la Forma en que se Explora el Mundo",
      Nao_somos_apenas_guia:
        "No somos solo una guía de viajes: somos una plataforma que cree en el poder transformador de la exploración. Imaginamos un mundo donde las barreras para descubrir nuevos lugares sean eliminadas, donde cada persona pueda planificar su aventura con confianza e inspiración.",
      Objetivo_referencia_global:
        "Nuestro objetivo es ser la referencia global en información de viajes, conectando exploradores con destinos de manera auténtica, accesible y profundamente enriquecedora.",
      Nossos_Pilares_Fundamentais: "Nuestros Pilares Fundamentales",
      Principios_que_guam_jornada:
        "Principios que guían cada paso de nuestro viaje",
      Pilar_Acessibilidade_Universal: "Accesibilidad Universal",
      Acreditamos_explorar_mundo:
        "Creemos que explorar el mundo debe ser posible para todos. Trabajamos para democratizar el acceso a la información de viajes, independientemente del origen o condición.",
      Pilar_Inovacao_Continua: "Innovación Continua",
      Mundo_muda_rapidamente:
        "El mundo cambia rápidamente, y nosotros también. Estamos evolucionando constantemente nuestra plataforma con las tecnologías más recientes para ofrecer a los viajeros la mejor experiencia posible.",
      Pilar_Impacto_Positivo: "Impacto Positivo",
      Queremos_contribuir_turismo:
        "Queremos que nuestras acciones contribuyan a un turismo más responsable y sostenible. Promovemos prácticas que respetan las culturas locales y preservan los destinos para las futuras generaciones.",
      Compromisso_com_Futuro: "Nuestro Compromiso con el Futuro",
      Metas_trajetoria_crescimento:
        "Metas que definen nuestra trayectoria de crecimiento",
      Meta_Comunidade_Global: "Comunidad Global de Viajeros",
      Desenvolvendo_funcionalidades_compartilhar:
        "Estamos desarrollando funcionalidades que permitirán a los usuarios compartir experiencias, crear itinerarios personalizados y conectarse con otros exploradores alrededor del mundo.",
      Meta_IA_Personalizada: "Inteligencia Artificial Personalizada",
      Planejamos_integrar_IA:
        "Planeamos integrar IA para ofrecer recomendaciones hiperpersonalizadas basadas en el perfil, presupuesto e intereses de cada viajero, haciendo que la planificación sea más inteligente y eficiente.",
      Meta_Sustentabilidade: "Sostenibilidad y Responsabilidad",
      Vamos_destacar_praticas_sustentaveis:
        "Destacaremos destinos y prácticas que promuevan el turismo sostenible, ayudando a los viajeros a tomar decisiones conscientes que beneficien a las comunidades locales y al medio ambiente.",
      Meta_Experiencias_Imersivas: "Experiencias Inmersivas",
      Explorando_tecnologias_AR_VR:
        'Estamos explorando tecnologías como la realidad aumentada y virtual para ofrecer vistas previas inmersivas de los destinos, permitiendo a los viajeros "visitar" lugares antes de embarcarse.',
      Junte_se_a_Nossa_Missao: "Únete a Nuestra Misión",
      Faca_parte_comunidade_redefinindo:
        "Forma parte de la comunidad que está redefiniendo la forma en que se explora el mundo",
      Explorar_Destinos_Btn: "Explorar Destinos",
      Conhecer_Equipe_Btn: "Conocer al Equipo",
      // --- TRADUÇÕES PARA ABOUT.HTML (ES) ---
      Titulo_Quem_Somos: "NoMap - Quiénes Somos",
      Quem_Somos_Titulo: "Quiénes Somos",
      A_equipe_apaixonada_por_viagens:
        "El apasionado equipo de viajeros y tecnólogos que transforman descubrimientos en experiencias.",
      Nossa_Origem: "Nuestro Origen",
      Da_Frustracao_a_Inspiracao: "De la Frustración a la Inspiración",
      NoMap_nasceu_de_uma_necessidade_real:
        "NoMap nació de una necesidad real: la frustración de buscar información de viaje en decenas de sitios web diferentes sin encontrar todo en un solo lugar. Lo que comenzó como un proyecto personal para resolver nuestro propio problema rápidamente se convirtió en una misión más grande.",
      Somos_viajantes_desenvolvedores_e_designers:
        "Somos viajeros, desarrolladores y diseñadores que compartimos la misma creencia:",
      descobrir_o_mundo_deve_ser_simples:
        "descubrir el mundo debe ser simple, inspirador y accesible para todos",
      Nossa_Filosofia: "Nuestra Filosofía",
      Principios_que_guam_cada_decisao:
        "Principios que guían cada decisión que tomamos",
      Paixao_Autentica: "Pasión Auténtica",
      Somos_verdadeiros_apaixonados_por_viagens:
        "Somos verdaderos apasionados por los viajes. Cada función que desarrollamos nace de nuestra propia experiencia como exploradores del mundo.",
      Inovacao_Consciente: "Innovación Consciente",
      Acreditamos_que_tecnologia_deve_simplificar:
        "Creemos que la tecnología debe simplificar, no complicar. Cada innovación está pensada para agregar valor real a tu experiencia de viaje.",
      Conexao_Global: "Conexión Global",
      Queremos_conectar_pessoas_a_lugares:
        "Queremos conectar personas con lugares, culturas y experiencias. El mundo es demasiado grande para explorarlo solo.",
      Nossa_Equipe: "Nuestro Equipo",
      Profissionais_apaixonados_por_criar_experiencias:
        "Profesionales apasionados por crear experiencias extraordinarias",
      Bruno_Nome: "Bruno",
      Bruno_Cargo: "Probador",
      Bruno_Descricao:
        "Guardián de la calidad y la experiencia del usuario. Cree que un producto excelente nace de la atención al detalle.",
      Guilherme_Nome: "Guilherme",
      Guilherme_Cargo: "Desarrollador Senior",
      Guilherme_Descricao:
        "Arquitecto de soluciones y mentor del equipo. Transforma desafíos complejos en código elegante y eficiente.",
      Felipe_Nome: "Felipe",
      Felipe_Cargo: "Desarrollador Junior",
      Felipe_Descricao:
        "Entusiasta de la tecnología e implementador de soluciones. Cree que cada línea de código contribuye a una mejor experiencia.",
      Faca_Parte_da_Nossa_Historia: "Forma Parte de Nuestra Historia",
      Junte_se_a_milhares_de_viajantes:
        "Únete a miles de viajeros que ya han descubierto el mundo con NoMap",
      // --- TRADUÇÕES PARA INTRO.HTML (ES) ---
      Titulo_Paises_em_Destaque: "NoMap - Países Destacados",
      Titulo_Paises_em_Destaque_Secao: "Países Destacados",
      Ver_Todos_os_Paises_Btn: "Ver Todos los Países",
      Sobre_o_NoMap_Btn: "Sobre NoMap",
      Nenhum_pais_encontrado: "No se encontraron países.",
      Erro_geral:
        "No se pudieron cargar los datos. Inténtalo de nuevo más tarde.",
      Nenhum_pais_encontrado: "No se encontraron países.",
      Erro_ao_carregar_paises: "Error al cargar los países.",
      Erro_ao_carregar_detalhes: "Error al cargar los detalles del país.",
      Carregando: "Cargando...",
      Descobrindo_destino_perfeito: "Descubriendo el destino perfecto...",
      Descobrindo_Destinos_Extraordinarios:
        "Descubriendo Destinos Extraordinarios",
      Preparando_experiencias_unicas:
        "Preparando experiencias únicas para ti...",
      Ops_algo_deu_errado: "¡Ups! Algo salió mal",
      Nao_conseguimos_carregar_os_destinos_em_destaque:
        "No pudimos cargar los destinos destacados en este momento.",
      Tentar_Novamente: "Intentar de Nuevo",
      Ver_Todos_os_Paises: "Ver Todos los Países",
      Continente: "Continente",
      Regiao: "Región",
      Subregiao: "Subregión",
      Capital: "Capital",
      Populacao: "Población",
      Area: "Área",
      Idioma: "Idioma",
      Moeda: "Moneda",
      Fuso_Horario: "Zona Horaria",
      Independente: "Independiente",
      Clima_Atual: "Clima Actual",
      Fronteiras_e_Geopolitica: "Fronteras y Geopolítica",
      Paises_Vizinhos: "Países Vecinos",
      Codigo_Telefonico: "Código Telefónico",
      Dominio_de_Internet: "Dominio de Internet",
      Nome_Nativo: "Nombre Nativo",
      Sensacao: "Sensación",
      Umidade: "Humedad",
      Minima: "Mínima",
      Maxima: "Máxima",
      Dados_climaticos_indisponiveis:
        "Datos climáticos no disponibles para esta ubicación.",
      Sim: "Sí",
      Nao: "No",
      "N/A": "N/D",
      Sem_fronteiras_terrestres: "Sin fronteras terrestres",
      Explorar: "Explorar",
    },
  },

  currentLanguage: "pt-br",

  init() {
    console.log("Inicializando header buttons...");
    headerButtons.loadSavedSettings();
    headerButtons.addEventListeners();
  },

  addEventListeners() {
    // Toggle para modo escuro
    const darkModeToggle = document.getElementById("darkModeToggle");
    if (darkModeToggle) {
      darkModeToggle.addEventListener("change", headerButtons.toggleDarkMode);
    }

    // Seletor de idioma
    const languageSelect = document.getElementById("languageSelect");
    if (languageSelect) {
      languageSelect.addEventListener("change", headerButtons.changeLanguage);
    }

    // Toggle para animações
    const animationsToggle = document.getElementById("animationsToggle");
    if (animationsToggle) {
      animationsToggle.addEventListener(
        "change",
        headerButtons.toggleAnimations
      );
    }

    // Toggle para notificações
    const notificationsToggle = document.getElementById("notificationsToggle");
    if (notificationsToggle) {
      notificationsToggle.addEventListener(
        "change",
        headerButtons.toggleNotifications
      );
    }

    // Botão salvar configurações
    const saveBtn = document.getElementById("saveConfigBtn");
    if (saveBtn) {
      saveBtn.addEventListener("click", headerButtons.saveSettings);
    }
  },
  toggleDarkMode(e) {
    const isDark = e.target.checked;
    // Aplicar/remover classe dark-theme
    document.body.classList.toggle("dark-theme", isDark);
    // Salvar preferência
    try {
      localStorage.setItem("nomap-dark-mode", isDark);
    } catch (err) {
      console.warn("Não foi possível salvar no localStorage:", err);
    }
    // Mostrar notificação
    headerButtons.showNotification(
      isDark ? "🌙 Modo escuro ativado" : "☀️ Modo claro ativado",
      isDark
        ? "Agora você pode navegar confortavelmente no escuro!"
        : "Voltando ao tema claro!"
    );
    console.log(`Modo escuro ${isDark ? "ativado" : "desativado"}`);
  },

  changeLanguage(e) {
    const selectedLanguage = e.target.value;
    headerButtons.currentLanguage = selectedLanguage;
    document.documentElement.lang = selectedLanguage;
    document.body.setAttribute("data-lang", selectedLanguage);

    // Primeiro, traduz o HTML estático
    headerButtons.translatePage(selectedLanguage);

    // --- NOVO: Recarregar e retraduzir conteúdo dinâmico baseado na página atual ---
    const currentPage = utils.getCurrentPage();
    switch (currentPage) {
      case "index.html":
      case "intro.html":
      case "":
        countries.loadAll(); // Isso vai recarregar E traduzir os cards
        featured.display(); // Isso vai recarregar E traduzir os destaques
        break;
      case "places.html":
        countries.loadAll(); // Recarrega a lista de países
        break;
      case "country.html":
        countryDetails.display(); // Recarrega os detalhes do país
        break;
    }

    // Salvar preferência
    try {
      localStorage.setItem("nomap-language", selectedLanguage);
    } catch (err) {
      console.warn("Não foi possível salvar no localStorage:", err);
    }

    // Mostrar notificação
    const langNames = {
      "pt-br": "Português (Brasil)",
      en: "English",
      es: "Español",
    };

    headerButtons.showNotification(
      `🌍 Idioma alterado`,
      `Interface alterada para ${langNames[selectedLanguage]}`
    );

    console.log(`Idioma alterado para: ${selectedLanguage}`);
  },

  translatePage(language) {
    // Traduzir elementos com data-translate
    document.querySelectorAll("[data-translate]").forEach((element) => {
      const key = element.getAttribute("data-translate");
      if (
        headerButtons.translations[language] &&
        headerButtons.translations[language][key]
      ) {
        if (element.tagName === "INPUT" && element.type === "text") {
          element.placeholder = headerButtons.translations[language][key];
        } else {
          element.textContent = headerButtons.translations[language][key];
        }
      }
    });

    // Traduzir placeholders
    document
      .querySelectorAll("[data-translate-placeholder]")
      .forEach((element) => {
        const key = element.getAttribute("data-translate-placeholder");
        if (
          headerButtons.translations[language] &&
          headerButtons.translations[language][key]
        ) {
          element.placeholder = headerButtons.translations[language][key];
        }
      });
  },
  // Nova função: Traduz um elemento ou todos os elementos dentro de um container
  translateElement(container = document) {
    const lang = headerButtons.currentLanguage;

    // Traduzir elementos com data-translate
    container.querySelectorAll("[data-translate]").forEach((element) => {
      const key = element.getAttribute("data-translate");
      if (
        headerButtons.translations[lang] &&
        headerButtons.translations[lang][key]
      ) {
        if (element.tagName === "INPUT" && element.type === "text") {
          element.placeholder = headerButtons.translations[lang][key];
        } else {
          element.textContent = headerButtons.translations[lang][key];
        }
      }
    });

    // Traduzir placeholders
    container
      .querySelectorAll("[data-translate-placeholder]")
      .forEach((element) => {
        const key = element.getAttribute("data-translate-placeholder");
        if (
          headerButtons.translations[lang] &&
          headerButtons.translations[lang][key]
        ) {
          element.placeholder = headerButtons.translations[lang][key];
        }
      });
  },

  toggleAnimations(e) {
    const enableAnimations = e.target.checked;

    // Aplicar/remover classe que desabilita animações
    document.body.classList.toggle("no-animations", !enableAnimations);

    // Salvar preferência
    try {
      localStorage.setItem("nomap-animations", enableAnimations);
    } catch (err) {
      console.warn("Não foi possível salvar no localStorage:", err);
    }

    // Mostrar notificação
    headerButtons.showNotification(
      enableAnimations ? "✨ Animações ativadas" : "🔇 Animações desativadas",
      enableAnimations
        ? "A interface agora tem transições suaves!"
        : "Animações desabilitadas para melhor performance"
    );

    console.log(`Animações ${enableAnimations ? "ativadas" : "desativadas"}`);
  },

  toggleNotifications(e) {
    const enableNotifications = e.target.checked;

    if (enableNotifications && "Notification" in window) {
      // Solicitar permissão
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          // Mostrar notificação de teste
          headerButtons.showBrowserNotification(
            "NoMap - Notificações",
            "Notificações ativadas com sucesso! Você receberá atualizações sobre novos destinos."
          );

          headerButtons.showNotification(
            "🔔 Notificações ativadas",
            "Você receberá atualizações sobre novos destinos!"
          );
        } else {
          // Se negou permissão, desmarcar o checkbox
          e.target.checked = false;
          headerButtons.showNotification(
            "❌ Permissão negada",
            "Permita notificações nas configurações do navegador"
          );
        }
      });
    } else if (!enableNotifications) {
      headerButtons.showNotification(
        "🔕 Notificações desativadas",
        "Você não receberá mais notificações do NoMap"
      );
    }

    // Salvar preferência
    try {
      localStorage.setItem("nomap-notifications", enableNotifications);
    } catch (err) {
      console.warn("Não foi possível salvar no localStorage:", err);
    }

    console.log(
      `Notificações ${enableNotifications ? "ativadas" : "desativadas"}`
    );
  },

  saveSettings() {
    const settings = {
      darkMode: document.getElementById("darkModeToggle")?.checked || false,
      language: document.getElementById("languageSelect")?.value || "pt-br",
      animations: document.getElementById("animationsToggle")?.checked || true,
      notifications:
        document.getElementById("notificationsToggle")?.checked || false,
    };

    // Salvar todas as configurações
    try {
      localStorage.setItem("nomap-settings", JSON.stringify(settings));
    } catch (err) {
      console.warn("Não foi possível salvar configurações:", err);
    }

    // Mostrar feedback no botão
    const saveBtn = document.getElementById("saveConfigBtn");
    if (saveBtn) {
      const originalText = saveBtn.innerHTML;
      saveBtn.innerHTML = '<i class="fas fa-check me-2"></i>Salvo!';
      saveBtn.classList.add("btn-success");
      saveBtn.classList.remove("btn-primary");

      setTimeout(() => {
        saveBtn.innerHTML = originalText;
        saveBtn.classList.remove("btn-success");
        saveBtn.classList.add("btn-primary");
      }, 2000);
    }

    // Mostrar notificação
    headerButtons.showNotification(
      "✅ Configurações salvas",
      "Todas as suas preferências foram salvas com sucesso!"
    );

    console.log("Configurações salvas:", settings);

    // Fechar modal após salvar
    const configModal = document.getElementById("configModal");
    if (configModal) {
      try {
        const modalInstance = bootstrap.Modal.getInstance(configModal);
        if (modalInstance) {
          setTimeout(() => modalInstance.hide(), 1500);
        }
      } catch (err) {
        console.log("Erro ao fechar modal:", err);
      }
    }
  },

  loadSavedSettings() {
    try {
      const savedSettings = localStorage.getItem("nomap-settings");
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);

        setTimeout(() => {
          // Modo escuro
          const darkModeToggle = document.getElementById("darkModeToggle");
          if (darkModeToggle && settings.darkMode) {
            darkModeToggle.checked = true;
            document.body.classList.add("dark-theme");
          }

          // Idioma
          const languageSelect = document.getElementById("languageSelect");
          if (languageSelect && settings.language) {
            languageSelect.value = settings.language;
            headerButtons.currentLanguage = settings.language;
            document.documentElement.lang = settings.language;
            document.body.setAttribute("data-lang", settings.language);
            headerButtons.translatePage(settings.language);
          }

          // Animações
          const animationsToggle = document.getElementById("animationsToggle");
          if (animationsToggle) {
            animationsToggle.checked = settings.animations !== false;
            document.body.classList.toggle(
              "no-animations",
              settings.animations === false
            );
          }

          // Notificações
          const notificationsToggle = document.getElementById(
            "notificationsToggle"
          );
          if (notificationsToggle) {
            notificationsToggle.checked = settings.notifications || false;
          }
        }, 100);
      }
    } catch (err) {
      console.warn("Erro ao carregar configurações:", err);
    }
  },

  // Notificação personalizada do site
  showNotification(title, message) {
    // Remover notificação existente
    const existingToast = document.querySelector(".notification-toast");
    if (existingToast) {
      existingToast.remove();
    }

    // Criar nova notificação
    const toast = document.createElement("div");
    toast.className = "notification-toast";
    toast.innerHTML = `
      <div class="toast-header">
        <div class="toast-icon">
          <i class="fas fa-bell"></i>
        </div>
        <strong style="margin-left: 0.5rem; flex: 1; color: var(--text-primary);">${title}</strong>
        <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
      <div class="toast-body">${message}</div>
    `;

    document.body.appendChild(toast);

    // Mostrar com animação
    setTimeout(() => toast.classList.add("show"), 100);

    // Remover automaticamente após 5 segundos
    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
      }
    }, 5000);
  },

  // Notificação do navegador
  showBrowserNotification(title, message) {
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, {
          body: message,
          icon: "assets/logo.png",
          badge: "assets/logo.png",
          tag: "nomap-notification",
        });
      } catch (err) {
        console.log("Erro ao mostrar notificação do navegador:", err);
      }
    }
  },
};

// Inicializar quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    headerButtons.init();
  }, 100);
});

// Também inicializar quando a página carregar completamente
window.addEventListener("load", () => {
  headerButtons.init();
});
