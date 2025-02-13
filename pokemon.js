const MAX_POKEMON = 649;
const POKEMON_LIMIT = 20;
let offset = 0;
const listWrapper = document.querySelector(".list-wrapper");
const searchInput = document.querySelector("#search-input");
const overlay = document.getElementById("pokemon-overlay");
const overlayContent = document.getElementById("pokemon-details");
const closeBtn = document.querySelector(".close-btn");
const debouncedHandleSearch = debounce(handleSearch, 300);
searchInput.addEventListener("keyup", debouncedHandleSearch);
const closeButton = document.querySelector(".search-close-icon");
closeButton.addEventListener("click", clearSearch);

const typeColors = {
  fire: "#F08030",
  water: "#6890F0",
  grass: "#78C850",
  electric: "#F8D030",
  ice: "#98D8D8",
  fighting: "#C03028",
  poison: "#A040A0",
  ground: "#E0C068",
  flying: "#A890F0",
  psychic: "#F85888",
  bug: "#A8B820",
  rock: "#B8A038",
  ghost: "#705898",
  dragon: "#7038F8",
  dark: "#705848",
  steel: "#B8B8D0",
  fairy: "#EE99AC",
  normal: "#A8A878"
};

let allPokemons = [];
let displayedPokemons = [];

function fetchAllPokemons() {
  fetch(`https://pokeapi.co/api/v2/pokemon?limit=${MAX_POKEMON}`)
    .then((response) => response.json())
    .then((data) => {
      allPokemons = data.results;
      return Promise.all(allPokemons.map(pokemon => fetchPokemonDataBeforeRedirect(pokemon.url.split("/")[6])));
    })
    .then((detailedPokemons) => {
      detailedPokemons.sort((a, b) => a.pokemon.id - b.pokemon.id);
      allPokemons = detailedPokemons;
      displayedPokemons = detailedPokemons.slice(0, POKEMON_LIMIT);
      displayPokemons(displayedPokemons);
    });
}

function fetchPokemons(offset, limit) {
  const paginatedPokemons = allPokemons.slice(offset, offset + limit);
  displayedPokemons = displayedPokemons.concat(paginatedPokemons);
  displayPokemons(displayedPokemons);
}

fetchAllPokemons();

async function fetchPokemonDataBeforeRedirect(id) {
  try {
    const [pokemon, pokemonSpecies] = await Promise.all([
      fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then((res) => res.json()),
      fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`).then((res) => res.json())
    ]);
    const pokemonTypes = pokemon.types.map(typeInfo => typeInfo.type.name);
    return { pokemon, pokemonSpecies, pokemonTypes };
  } catch (error) {
    console.error("Failed to fetch Pokemon data before redirect");
  }
}

function displayPokemons(pokemons) {
  const listItemsContainer = document.querySelector(".list-items-container") || document.createElement("div");
  listItemsContainer.className = "list-items-container";
  listItemsContainer.innerHTML = "";
  pokemons.forEach((data) => createPokemonListItem(data, listItemsContainer));
  if (!listWrapper.contains(listItemsContainer)) {
    listWrapper.appendChild(listItemsContainer);
  }
  addLoadMoreButton();
}

function createPokemonListItem(data, container) {
  const pokemonID = data.pokemon.id;
  const listItem = document.createElement("div");
  listItem.className = "list-item";
  const pokemonTypes = data.pokemonTypes;
  const pokemonName = capitalizeFirstLetter(data.pokemon.name);
  listItem.innerHTML = generatePokemonListItemHTML(pokemonID, pokemonName, pokemonTypes, data.pokemon.name);
  listItem.addEventListener("click", () => openOverlay(data.pokemon, data.pokemonSpecies));
  container.appendChild(listItem);
}

function generatePokemonListItemHTML(pokemonID, pokemonName, pokemonTypes, pokemonAltName) {
  return `
    <div class="number-wrap">
      <p class="caption-fonts"><b>#${pokemonID}<b></p>
    </div>
    <div class="img-wrap">
      <img src="https://raw.githubusercontent.com/pokeapi/sprites/master/sprites/pokemon/other/dream-world/${pokemonID}.svg" alt="${pokemonAltName}" />
    </div>
    <div class="name-wrap">
      <p class="body3-fonts"><b>${pokemonName}<b></p>
    </div>
    <div class="type-wrap">
      ${pokemonTypes.map(createTypeBadge).join(' ')}
    </div>
  `;
}

function addLoadMoreButton() {
  const existingButton = document.querySelector(".load-more-btn");
  if (existingButton) {
    existingButton.remove();
  }
  const loadMoreButtonContainer = document.createElement("div");
  loadMoreButtonContainer.className = "load-more-button-container";
  const loadMoreButton = document.createElement("button");
  loadMoreButton.textContent = "Load More Pokémon";
  loadMoreButton.className = "load-more-btn";
  loadMoreButton.addEventListener("click", () => {
    offset += POKEMON_LIMIT;
    fetchPokemons(offset, POKEMON_LIMIT);
  });
  loadMoreButtonContainer.appendChild(loadMoreButton);
  listWrapper.appendChild(loadMoreButtonContainer);
}

function openOverlay(pokemon, pokemonSpecies) {
  const pokemonType = pokemon.types[0].type.name;
  const pokemonName = capitalizeFirstLetter(pokemon.name);
  const pokemonTypes = pokemon.types.map(typeInfo => typeInfo.type.name);
  overlayContent.innerHTML = generateOverlayContent(pokemon, pokemonName, pokemonTypes);
  overlay.style.display = "flex";
  setupOverlayButtons(pokemon);
}

function generateOverlayContent(pokemon, pokemonName, pokemonTypes) {
  return `
    <span class="close-btn">&times;</span>
    <h2>${pokemonName}</h2>
    <div class="img-wrap">
      <img src="https://raw.githubusercontent.com/pokeapi/sprites/master/sprites/pokemon/other/dream-world/${pokemon.id}.svg" alt="${pokemon.name}" />
    </div>
    ${createTypeBadges(pokemonTypes)}
    ${createProgressBar("HP", pokemon.stats[0].base_stat)}
    ${createProgressBar("Attack", pokemon.stats[1].base_stat)}
    ${createProgressBar("Defense", pokemon.stats[2].base_stat)}
    <br>
    <br>
    <button class="prev-btn">&larr;</button>
    <button class="next-btn">&rarr;</button>
  `;
}

function createTypeBadges(pokemonTypes) {
  return `
    <div class="type-wrap">
      ${pokemonTypes.map(createTypeBadge).join(' ')}
    </div>
  `;
}

function createTypeBadge(type) {
  return `<span class="badge" style="background-color: ${typeColors[type]};">${type}</span>`;
}

function createProgressBar(label, value) {
  return `
    <p class="progress-header">${label}: ${value}</p>
    <div class="progress">
      <div class="progress-bar" role="progressbar" style="width: ${value}%" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="100">${value}</div>
    </div>
  `;
}

function setupOverlayButtons(pokemon) {
  const closeButton = overlayContent.querySelector(".close-btn");
  closeButton.addEventListener("click", () => overlay.style.display = "none");
  const prevButton = overlayContent.querySelector(".prev-btn");
  const nextButton = overlayContent.querySelector(".next-btn");
  const currentIndex = allPokemons.findIndex(p => p.pokemon.id == pokemon.id);
  setupPrevButton(prevButton, currentIndex, pokemon.id);
  setupNextButton(nextButton, currentIndex, pokemon.id);
}

function setupPrevButton(prevButton, currentIndex, pokemonId) {
  if (currentIndex === 0) {
    prevButton.style.display = "none";
  } else {
    prevButton.style.display = "block";
    prevButton.addEventListener("click", () => navigatePokemon(pokemonId, -1));
  }
}

function setupNextButton(nextButton, currentIndex, pokemonId) {
  if (currentIndex === allPokemons.length - 1) {
    nextButton.style.display = "none";
  } else {
    nextButton.style.display = "block";
    nextButton.addEventListener("click", () => navigatePokemon(pokemonId, 1));
  }
}

function navigatePokemon(currentId, direction) {
  const currentIndex = allPokemons.findIndex(pokemon => pokemon.pokemon.id == currentId);
  const newIndex = (currentIndex + direction + allPokemons.length) % allPokemons.length;
  const newPokemonID = allPokemons[newIndex].pokemon.id;
  fetchPokemonDataBeforeRedirect(newPokemonID).then(data => {
    if (data) {
      openOverlay(data.pokemon, data.pokemonSpecies);
    }
  });
}

function debounce(func, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

function handleSearch() {
  const searchTerm = searchInput.value.toUpperCase();
  const notification = document.getElementById("notification");
  if (searchTerm.length < 3) {
    notification.style.display = "block";
    displayPokemons(displayedPokemons);
    return;
  } else {
    notification.style.display = "none";
  }
  if (searchTerm === "") {
    displayPokemons(displayedPokemons);
    return;
  }
  const filteredPokemons = filterPokemons(searchTerm);
  displayFilteredPokemons(filteredPokemons);
}

function filterPokemons(searchTerm) {
  return allPokemons.filter(pokemon => {
    const pokemonID = pokemon.pokemon.id.toString();
    const pokemonName = pokemon.pokemon.name.toUpperCase();
    return pokemonID.includes(searchTerm) || pokemonName.includes(searchTerm);
  });
}

function displayFilteredPokemons(pokemons) {
  const listItemsContainer = document.querySelector(".list-items-container");
  listItemsContainer.innerHTML = "";
  pokemons.forEach((data) => createPokemonListItem(data, listItemsContainer));
}

function clearSearch() {
  searchInput.value = "";
  displayPokemons(displayedPokemons);
  document.getElementById("notification").style.display = "none";
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}