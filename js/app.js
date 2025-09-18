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
          <span class="visually-hidden">Carregando...</span>
        </div>
        <p class="mt-3 text-muted fs-5">Descobrindo o destino perfeito...</p>
      </div>`,

    featured: () => `
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
      </style>`,
  },

  error: {
    general: (message) => `
      <div class="alert alert-danger w-100" role="alert">
        ${
          message ||
          "Não foi possível carregar os dados. Tente novamente mais tarde."
        }
      </div>`,

    noResults: () => `
      <div class="col-12">
        <div class="alert alert-info text-center" role="alert">
          <i class="fas fa-search me-2"></i>Nenhum país encontrado.
        </div>
      </div>`,

    featured: () => `
      <div class="col-12">
        <div class="premium-error-card text-center p-5 rounded-4">
          <div class="error-icon mb-4">
            <i class="fas fa-globe-americas fa-4x text-muted opacity-50"></i>
          </div>
          <h3 class="text-dark mb-3">Ops! Algo deu errado</h3>
          <p class="text-muted mb-4 fs-5">Não conseguimos carregar os destinos em destaque no momento.</p>
          <div class="d-flex gap-3 justify-content-center flex-wrap">
            <button class="btn btn-primary btn-lg rounded-pill px-4" onclick="featured.display()">
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
      </style>`,
  },

  countryCard: (country) => {
    const data = extractCountryData(country);

    return `
    <div class="col">
      <div class="card country-card h-100 shadow-sm border-0 card-hover-lift card-hover-border d-flex flex-column">
        <div class="position-relative flex-shrink-0">
          <img src="${data.flagUrl}"
               class="country-flag-img w-100"
               style="height: 200px; object-fit: cover;"
               alt="Bandeira de ${data.name}"
               onerror="this.src='${CONFIG.defaults.placeholderFlag}'">
          <div class="country-badge-container">
            <span class="country-badge">${data.continent}</span>
          </div>
        </div>
       
        <div class="card-body d-flex flex-column">
          <h5 class="card-title fw-bold text-primary mb-3">${data.name}</h5>
         
          <div class="country-info-grid flex-grow-1">
            ${createInfoItem("Capital", data.capital)}
            ${createInfoItem("População", data.population)}
            ${createInfoItem("Idioma", data.language)}
            ${createInfoItem("Moeda", data.currency)}
          </div>
         
          <a href="country.html?name=${encodeURIComponent(data.name)}"
             class="btn btn-primary mt-auto w-100 btn-hover-shadow">
            <i class="fas fa-map-marker-alt me-2"></i>Explorar
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
      { icon: "fa-globe", label: "Continente", value: data.continent },
      { icon: "fa-map-marker-alt", label: "Região", value: data.region },
      { icon: "fa-building", label: "Capital", value: data.capital },
      { icon: "fa-users", label: "População", value: data.population },
      { icon: "fa-ruler-combined", label: "Área", value: data.area },
      { icon: "fa-language", label: "Idioma", value: data.language },
      { icon: "fa-money-bill-wave", label: "Moeda", value: data.currency },
      { icon: "fa-clock", label: "Fuso Horário", value: data.timezone },
      {
        icon: "fa-flag-checkered",
        label: "Independente",
        value: data.independent,
      },
    ];

    return `
      <div class="col-lg-4 col-md-6">
        <div class="card h-100 shadow-sm border-0 rounded-4 transition-card">
          <div class="card-header bg-primary text-white py-3">
            <h5 class="mb-0"><i class="fas fa-info-circle me-2"></i>Informações Essenciais</h5>
          </div>
          <div class="card-body">
            <ul class="list-unstyled">
              ${items
                .map(
                  (item) => `
                <li class="mb-3">
                  <strong><i class="fas ${item.icon} me-2 text-muted"></i>${item.label}:</strong> ${item.value}
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
          <div class="small text-muted">Sensação</div>
          <div class="fw-bold">${Math.round(
            weatherData.main.feels_like
          )}°C</div>
        </div>
        <div class="col-6">
          <div class="small text-muted">Umidade</div>
          <div class="fw-bold">${weatherData.main.humidity}%</div>
        </div>
        <div class="col-6">
          <div class="small text-muted">Mínima</div>
          <div class="fw-bold">${Math.round(weatherData.main.temp_min)}°C</div>
        </div>
        <div class="col-6">
          <div class="small text-muted">Máxima</div>
          <div class="fw-bold">${Math.round(weatherData.main.temp_max)}°C</div>
        </div>
      </div>
    `
      : `
      <div class="text-center py-5">
        <i class="fas fa-cloud-sun fa-3x text-secondary opacity-50 mb-3"></i>
        <p class="text-muted">Dados climáticos indisponíveis para este local.</p>
      </div>
    `;

    return `
      <div class="col-lg-4 col-md-6">
        <div class="card h-100 shadow-sm border-0 rounded-4 transition-card">
          <div class="card-header bg-success text-white py-3">
            <h5 class="mb-0"><i class="fas fa-cloud-sun me-2"></i>Clima Atual</h5>
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
            <h5 class="mb-0"><i class="fas fa-border-all me-2"></i>Fronteiras & Geopolítica</h5>
          </div>
          <div class="card-body">
            <ul class="list-unstyled">
              <li class="mb-3">
                <strong><i class="fas fa-globe-americas me-2 text-muted"></i>Países Vizinhos:</strong><br>
                <span class="text-break">${data.borders}</span>
              </li>
              <li class="mb-3">
                <strong><i class="fas fa-passport me-2 text-muted"></i>Código Telefônico:</strong> ${data.phoneCode}
              </li>
              <li class="mb-3">
                <strong><i class="fas fa-tachometer-alt me-2 text-muted"></i>Domínio de Internet:</strong> ${data.internetDomain}
              </li>
              <li class="mb-3">
                <strong><i class="fas fa-building-columns me-2 text-muted"></i>Nome Nativo:</strong><br>
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
              ${featured.buildStatItem(
                "fa-users",
                "População",
                data.population
              )}
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

  buildStatItem: (icon, label, value) => `
    <div class="stat-item">
      <div class="stat-icon"><i class="fas ${icon}"></i></div>
      <div class="stat-content">
        <span class="stat-label">${label}</span>
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
