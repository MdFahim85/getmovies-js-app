const apiKey = "4bafed99";
const searchInput = document.getElementById("searchInput");
const ratingFilter = document.getElementById("ratingFilter");
const genreFilter = document.getElementById("genreFilter");
const movieGrid = document.getElementById("movieGrid");
const pagination = document.getElementById("pagination");
const modal = document.getElementById("movieModal");
const modalCloseBtn = document.getElementById("modalClose");
const showFavoritesBtn = document.getElementById("showFavoritesBtn");

let detailedMovies = [];
let currentSearchTerm = "";
let currentPage = 1;
let totalResults = 0;
let showingFavorites = false;

function getFavorites() {
  const favs = localStorage.getItem("favoriteMovies");
  return favs ? JSON.parse(favs) : [];
}

function saveFavorites(favs) {
  localStorage.setItem("favoriteMovies", JSON.stringify(favs));
}

function isFavorite(imdbID) {
  const favs = getFavorites();
  return favs.includes(imdbID);
}

function toggleFavorite(imdbID) {
  let favs = getFavorites();
  if (favs.includes(imdbID)) {
    favs = favs.filter((id) => id !== imdbID);
  } else {
    favs.push(imdbID);
  }
  saveFavorites(favs);
}

// --- FETCH MOVIE DETAILS ---

const fetchMovieDetails = async (movies) => {
  const requests = movies.map((m) =>
    axios.get("https://www.omdbapi.com/", {
      params: {
        apikey: apiKey,
        i: m.imdbID,
        plot: "short",
      },
    })
  );
  const results = await Promise.all(requests);
  return results.map((res) => res.data);
};

const renderMovies = (movies) => {
  movieGrid.innerHTML = "";

  if (movies.length === 0) {
    movieGrid.innerHTML = `<p class="col-span-12 text-center text-white text-xl">No movies found.</p>`;
    return;
  }

  movies.slice(0, 8).forEach((movie) => {
    const poster =
      movie.Poster !== "N/A"
        ? movie.Poster
        : "https://via.placeholder.com/300x450?text=No+Image";

    const div = document.createElement("div");
    div.className =
      "relative col-span-12 sm:col-span-6 lg:col-span-3 cursor-pointer";

    div.innerHTML = `
      <img class="w-full h-auto object-cover rounded-2xl hover:scale-105 transition-scale duration-300 ease-in-out" src="${poster}" alt="${
      movie.Title
    }" />
      <button class="fav-btn absolute top-2 right-2 text-yellow-400 text-5xl cursor-pointer" title="Add to favorites">
        ${isFavorite(movie.imdbID) ? "&#9733;" : "&#9734;"}
      </button>
      <p class="mt-2 text-white text-center font-semibold">${movie.Title} (${
      movie.Year
    })</p>
      <p class="text-sm text-yellow-400 text-center">⭐ ${movie.imdbRating} | ${
      movie.Genre
    }</p>
    `;

    div.addEventListener("click", (e) => {
      if (e.target.classList.contains("fav-btn")) return;
      document.getElementById("modalPoster").src = poster;
      document.getElementById("modalTitle").textContent = movie.Title;
      document.getElementById("modalYear").textContent = `Year: ${movie.Year}`;
      document.getElementById(
        "modalRating"
      ).textContent = `IMDb Rating: ${movie.imdbRating}`;
      document.getElementById(
        "modalGenre"
      ).textContent = `Genre: ${movie.Genre}`;
      document.getElementById("modalRuntime").textContent = `Runtime: ${
        movie.Runtime || "N/A"
      }`;
      document.getElementById("modalDirector").textContent = `Director: ${
        movie.Director || "N/A"
      }`;
      document.getElementById("modalActors").textContent = `Actors: ${
        movie.Actors || "N/A"
      }`;
      document.getElementById("modalPlot").textContent =
        "Plot : " + movie.Plot || "Plot not available.";
      document.getElementById("modalLanguage").textContent = `Language: ${
        movie.Language || "N/A"
      }`;
      document.getElementById("modalAwards").textContent = `Awards: ${
        movie.Awards || "N/A"
      }`;

      modal.classList.remove("hidden");
    });

    const favBtn = div.querySelector(".fav-btn");
    favBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      toggleFavorite(movie.imdbID);

      favBtn.innerHTML = isFavorite(movie.imdbID) ? "&#9733;" : "&#9734;";
      if (showingFavorites) {
        detailedMovies = detailedMovies.filter((m) => isFavorite(m.imdbID));
        renderMovies(detailedMovies);
      }
    });

    movieGrid.appendChild(div);
  });
};

const applyFilters = () => {
  let filtered = [...detailedMovies];

  const selectedRating = ratingFilter.value;
  const selectedGenre = genreFilter.value.toLowerCase();

  if (selectedRating !== "all") {
    filtered = filtered.filter(
      (movie) =>
        movie.imdbRating !== "N/A" &&
        parseFloat(movie.imdbRating) >= parseInt(selectedRating)
    );
  }

  if (selectedGenre !== "all") {
    filtered = filtered.filter((movie) =>
      movie.Genre.toLowerCase().includes(selectedGenre)
    );
  }

  renderMovies(filtered);
  renderPagination();
};

const loadMovies = async (searchTerm, page = 1) => {
  try {
    const res = await axios.get("https://www.omdbapi.com/", {
      params: {
        apikey: apiKey,
        s: searchTerm,
        page: page,
      },
    });

    if (res.data.Response === "True") {
      totalResults = parseInt(res.data.totalResults);
      currentSearchTerm = searchTerm;
      currentPage = page;

      const searchResults = res.data.Search;
      detailedMovies = await fetchMovieDetails(searchResults);
      applyFilters();
      showingFavorites = false;
      showFavoritesBtn.textContent = "Favorites";
    } else {
      detailedMovies = [];
      renderMovies([]);
      renderPagination();
    }
  } catch (err) {
    console.error("Error fetching movies:", err);
  }
};

const renderPagination = () => {
  pagination.innerHTML = "";

  const totalPages = Math.ceil(totalResults / 10);
  if (totalPages <= 1 || showingFavorites) return;

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Previous";
  prevBtn.disabled = currentPage === 1;
  prevBtn.className =
    "px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50 hover:bg-gray-400 hover:text-slate-700 transition-all duration-300 ease-in-out";
  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) loadMovies(currentSearchTerm, currentPage - 1);
  });

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.className =
    "px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50 hover:bg-gray-400 hover:text-slate-700 transition-all duration-300 ease-in-out";
  nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages)
      loadMovies(currentSearchTerm, currentPage + 1);
  });

  const pageInfo = document.createElement("span");
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  pageInfo.className = "text-white px-4 py-2 flex items-center";

  pagination.appendChild(prevBtn);
  pagination.appendChild(pageInfo);
  pagination.appendChild(nextBtn);
};

const showFavorites = async () => {
  const favs = getFavorites();
  if (favs.length === 0) {
    detailedMovies = [];
    renderMovies([]);
    renderPagination();
    return;
  }

  // Fetch detailed info for favorites
  const requests = favs.map((id) =>
    axios.get("https://www.omdbapi.com/", {
      params: {
        apikey: apiKey,
        i: id,
        plot: "short",
      },
    })
  );

  const results = await Promise.all(requests);
  detailedMovies = results.map((res) => res.data);
  showingFavorites = true;
  renderMovies(detailedMovies);
  pagination.innerHTML = "";
  showFavoritesBtn.textContent = "Back to Search";
};

searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const term = searchInput.value.trim();
    if (term) loadMovies(term, 1);
  }
});

ratingFilter.addEventListener("change", () => {
  if (!showingFavorites) applyFilters();
});

genreFilter.addEventListener("change", () => {
  if (!showingFavorites) applyFilters();
});

modalCloseBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
});

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.add("hidden");
  }
});

showFavoritesBtn.addEventListener("click", () => {
  if (showingFavorites) {
    loadMovies(currentSearchTerm, currentPage);
  } else {
    showFavorites();
  }
});

const getRandomKeyword = () => {
  const words = ["batman", "love", "alien", "war", "dog", "spy", "hero"];
  return words[Math.floor(Math.random() * words.length)];
};

loadMovies(getRandomKeyword());
