const MAX_POKEMON = 151;
const listWrapper = document.querySelector(".list-wrapper");
const searchInput = document.querySelector("#search-input");
const overlay = document.getElementById("pokemon-overlay");
const overlayContent = document.getElementById("pokemon-details");
const closeBtn = document.querySelector(".close-btn");

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

fetch(`https://pokeapi.co/api/v2/pokemon?limit=${MAX_POKEMON}`)
  .then((response) => response.json())
  .then((data) => {
    allPokemons = data.results;
    return Promise.all(allPokemons.map(pokemon => fetchPokemonDataBeforeRedirect(pokemon.url.split("/")[6])));
  })
  .then((detailedPokemons) => {
    detailedPokemons.sort((a, b) => a.pokemon.id - b.pokemon.id);
    displayPokemons(detailedPokemons);
  });

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
  listWrapper.innerHTML = "";

  pokemons.forEach((data) => {
    const pokemonID = data.pokemon.id;
    const listItem = document.createElement("div");
    listItem.className = "list-item";

    const pokemonTypes = data.pokemonTypes;

    listItem.innerHTML = `
        <div class="number-wrap">
            <p class="caption-fonts"><b>#${pokemonID}<b></p>
        </div>
        <div class="img-wrap">
            <img src="https://raw.githubusercontent.com/pokeapi/sprites/master/sprites/pokemon/other/dream-world/${pokemonID}.svg" alt="${data.pokemon.name}" />
        </div>
        <div class="name-wrap">
            <p class="body3-fonts"><b>${data.pokemon.name}<b></p>
        </div>
        <div class="type-wrap">
            ${pokemonTypes.map(type => `<span class="badge" style="background-color: ${typeColors[type]};">${type}</span>`).join(' ')}
        </div>
    `;

    listItem.addEventListener("click", () => {
      openOverlay(data.pokemon, data.pokemonSpecies);
    });

    listWrapper.appendChild(listItem);
  });
}

function openOverlay(pokemon, pokemonSpecies) {
    const pokemonType = pokemon.types[0].type.name;
    const backgroundColor = typeColors[pokemonType];
  
    overlayContent.innerHTML = `
      <span class="close-btn">&times;</span>
      <h2>${pokemon.name}</h2>
      <div class="img-wrap">
        <img src="https://raw.githubusercontent.com/pokeapi/sprites/master/sprites/pokemon/other/dream-world/${pokemon.id}.svg" alt="${pokemon.name}" />
      </div>
      <p>Height: ${pokemon.height}</p>
      <p>Weight: ${pokemon.weight}</p>
      <p>Base Experience: ${pokemon.base_experience}</p>
      <p>Species: ${pokemonSpecies.name}</p>
      <button class="prev-btn">&larr;</button>
      <button class="next-btn">&rarr;</button>
    `;
  
    overlayContent.style.backgroundColor = backgroundColor;
    overlay.style.display = "flex";
  
    const closeButton = overlayContent.querySelector(".close-btn");
    closeButton.addEventListener("click", () => {
      overlay.style.display = "none";
    });
  
    const prevButton = overlayContent.querySelector(".prev-btn");
    const nextButton = overlayContent.querySelector(".next-btn");
  
    const currentIndex = allPokemons.findIndex(p => p.pokemon.id == pokemon.id);
  
    if (currentIndex === 0) {
      prevButton.style.display = "none";
    } else {
      prevButton.style.display = "block";
      prevButton.addEventListener("click", () => navigatePokemon(pokemon.id, -1));
    }
  
    if (currentIndex === allPokemons.length - 1) {
      nextButton.style.display = "none";
    } else {
      nextButton.style.display = "block";
      nextButton.addEventListener("click", () => navigatePokemon(pokemon.id, 1));
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
    const searchTerm = searchInput.value.toLowerCase();
    const notification = document.getElementById("notification");
  
    if (searchTerm.length < 3) {
      notification.style.display = "block";
      displayPokemons(allPokemons);
      return;
    } else {
      notification.style.display = "none";
    }
  
    const filteredPokemons = allPokemons.filter(pokemon => {
      const pokemonID = pokemon.pokemon.id.toString();
      const pokemonName = pokemon.pokemon.name.toLowerCase();
      return pokemonID.includes(searchTerm) || pokemonName.includes(searchTerm);
    });
    displayPokemons(filteredPokemons);
  }
  
  const debouncedHandleSearch = debounce(handleSearch, 300);
  
  searchInput.addEventListener("keyup", debouncedHandleSearch);
  
  const closeButton = document.querySelector(".search-close-icon");
  closeButton.addEventListener("click", clearSearch);
  
  function clearSearch() {
    searchInput.value = "";
    displayPokemons(allPokemons);
    document.getElementById("notification").style.display = "none";
  }