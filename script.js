const form = document.querySelector("#form");
const loader = document.querySelector("#loader");
const results = document.querySelector("#results");
const searchInput = document.querySelector("#text");
const themeToggle = document.querySelector("#theme-toggle");

// Check if required elements exist
if (!form || !loader || !results || !searchInput || !themeToggle) {
  console.error("Required DOM elements not found. Make sure your HTML includes: #form, #text, #loader, #results, #theme-toggle");
}

// API Configuration
const API_KEY = "c47184553e058b7c3110d774ac2d6723"; // Move to environment variable in production
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const LOGO_BASE_URL = "https://image.tmdb.org/t/p/w45";

form.addEventListener("submit", (e) => {
  e.preventDefault();
  GetMovies();
});

const GetMovies = async () => {
  const userSearch = searchInput.value.trim();
  
  if (!userSearch) {
    showError("Please enter a movie title to search.");
    return;
  }

  showLoader(true);
  clearResults();

  try {
    const config = {
      params: {
        api_key: API_KEY,
        query: userSearch,
      },
    };
    
    const res = await axios(`${BASE_URL}/search/movie`, config);
    
    if (res.data.results && res.data.results.length > 0) {
      await display(res.data.results);
    } else {
      showNoResults();
    }
    
  } catch (err) {
    console.error("Error fetching movies:", err);
    showError("Failed to fetch movies. Please check your internet connection and try again.");
  } finally {
    showLoader(false);
  }
};

const display = async (movies) => {
  clearResults();
  
  try {
    // Get providers for all movies
    const providers = await Promise.all(
      movies.map(movie => getProvider(movie.id))
    );

    movies.forEach((movie, index) => {
      const column = document.createElement("div");
      column.className = "column is-12-mobile is-6-tablet is-4-desktop";
      
      const provider = providers[index];
      const year = movie.release_date ? movie.release_date.split("-")[0] : "N/A";
      const overview = movie.overview 
        ? (movie.overview.length > 60 ? movie.overview.substring(0, 60) + "..." : movie.overview)
        : "No description available";

      // Create provider HTML
      const providerHtml = createProviderHtml(provider);
      
      const card = document.createElement("div");
      card.className = "movie-card";

      card.innerHTML = `
        <div class="movie-poster">
          <img src="${movie.poster_path ? IMAGE_BASE_URL + movie.poster_path : 'https://via.placeholder.com/300x450?text=No+Image'}" 
               alt="${movie.title}"
               onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'" />
        </div>
        <div class="movie-info">
          <div class="movie-title" title="${movie.title}">${movie.title}</div>
          <div class="movie-meta">
            <span class="year">${year}</span>
            <span class="rating">⭐ ${movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}</span>
            <span class="quality">HD</span>
            <span class="language">EN</span>
          </div>
          <div class="movie-overview" title="${movie.overview || 'No description available'}">${overview}</div>
          ${providerHtml}
        </div>
      `;

      column.appendChild(card);
      results.appendChild(column);
    });
  } catch (error) {
    console.error("Error displaying movies:", error);
    showError("Error displaying movie results.");
  }
};

const getProvider = async (movieId) => {
  try {
    const config = {
      params: {
        api_key: API_KEY,
      },
    };
    
    const res = await axios(`${BASE_URL}/movie/${movieId}/watch/providers`, config);
    const indianData = res.data.results?.IN;

    if (!indianData || !indianData.flatrate || indianData.flatrate.length === 0) {
      return [];
    }

    return indianData.flatrate.map(provider => ({
      name: provider.provider_name,
      logo: LOGO_BASE_URL + provider.logo_path,
    }));
    
  } catch (error) {
    console.error(`Error fetching providers for movie ${movieId}:`, error);
    return [];
  }
};

const createProviderHtml = (providers) => {
  if (!Array.isArray(providers) || providers.length === 0) {
    return '<div class="no-providers">No streaming info available</div>';
  }

  let providerHtml = '<div class="provider-logos">';
  providers.forEach(provider => {
    providerHtml += `
      <img src="${provider.logo}" 
           alt="${provider.name}" 
           title="Available on ${provider.name}"
           onerror="this.style.display='none'" />
    `;
  });
  providerHtml += "</div>";
  
  return providerHtml;
};

// Utility functions
const showLoader = (show) => {
  if (loader) {
    loader.style.display = show ? "block" : "none";
  }
};

const clearResults = () => {
  if (results) {
    results.innerHTML = "";
  }
};

const showError = (message) => {
  if (results) {
    results.innerHTML = `<div class="error-message"><p>❌ ${message}</p></div>`;
  }
};

const showNoResults = () => {
  if (results) {
    results.innerHTML = `<div class="no-results"><p>🔍 No movies found. Try a different search term.</p></div>`;
  }
};

// Theme Toggle Functionality
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");

    if (document.body.classList.contains("light-mode")) {
      themeToggle.textContent = "☀️";
      try {
        localStorage.setItem("theme", "light");
      } catch (e) {
        console.warn("Could not save theme preference:", e);
      }
    } else {
      themeToggle.textContent = "🌙";
      try {
        localStorage.setItem("theme", "dark");
      } catch (e) {
        console.warn("Could not save theme preference:", e);
      }
    }
  });
}

// Load saved theme
window.addEventListener("load", () => {
  try {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" && themeToggle) {
      document.body.classList.add("light-mode");
      themeToggle.textContent = "☀️";
    }
  } catch (e) {
    console.warn("Could not load theme preference:", e);
  }
});

// Add keyboard support for search
if (searchInput) {
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      GetMovies();
    }
  });
}

const randomBtn = document.querySelector("#random-btn");

if (randomBtn) {
  randomBtn.addEventListener("click", () => {
    GetRandomMovies();
  });
}

// Method 1: Using Discover API with random page (Most reliable)
const GetRandomMovies = async () => {
  showLoader(true);
  clearResults();

  try {
    // Generate random page (TMDB has thousands of pages)
    const randomPage = Math.floor(Math.random() * 500) + 1; // Pages 1-500
    
    const config = {
      params: {
        api_key: API_KEY,
        page: randomPage,
        sort_by: 'popularity.desc', // Get popular movies for better quality
        'vote_count.gte': 100, // Movies with at least 100 votes
        'vote_average.gte': 6.0, // Minimum rating of 6.0
      },
    };
    
    const res = await axios(`${BASE_URL}/discover/movie`, config);
    
    if (res.data.results && res.data.results.length > 0) {
      // Shuffle and pick random 6-12 movies from the page
      const shuffled = res.data.results.sort(() => 0.5 - Math.random());
      const randomMovies = shuffled.slice(0, Math.floor(Math.random() * 7) + 6); // 6-12 movies
      await display(randomMovies);
    } else {
      showNoResults();
    }
    
  } catch (err) {
    console.error("Error fetching random movies:", err);
    showError("Failed to fetch random movies. Please try again.");
  } finally {
    showLoader(false);
  }
};

// Method 2: Genre-based random movies (Alternative approach)
const GetRandomMoviesByGenre = async () => {
  showLoader(true);
  clearResults();

  try {
    // Popular genre IDs
    const genres = [
      28,   // Action
      12,   // Adventure
      16,   // Animation
      35,   // Comedy
      80,   // Crime
      99,   // Documentary
      18,   // Drama
      10751, // Family
      14,   // Fantasy
      36,   // History
      27,   // Horror
      10402, // Music
      9648, // Mystery
      10749, // Romance
      878,  // Science Fiction
      10770, // TV Movie
      53,   // Thriller
      10752, // War
      37    // Western
    ];
    
    const randomGenre = genres[Math.floor(Math.random() * genres.length)];
    const randomPage = Math.floor(Math.random() * 50) + 1;
    
    const config = {
      params: {
        api_key: API_KEY,
        with_genres: randomGenre,
        page: randomPage,
        sort_by: 'popularity.desc',
        'vote_count.gte': 50,
        'vote_average.gte': 5.5,
      },
    };
    
    const res = await axios(`${BASE_URL}/discover/movie`, config);
    
    if (res.data.results && res.data.results.length > 0) {
      const shuffled = res.data.results.sort(() => 0.5 - Math.random());
      const randomMovies = shuffled.slice(0, 8);
      await display(randomMovies);
    } else {
      showNoResults();
    }
    
  } catch (err) {
    console.error("Error fetching random movies by genre:", err);
    showError("Failed to fetch random movies. Please try again.");
  } finally {
    showLoader(false);
  }
};

// Method 3: Year-based random movies
const GetRandomMoviesByYear = async () => {
  showLoader(true);
  clearResults();

  try {
    // Random year between 1990-2024
    const currentYear = new Date().getFullYear();
    const randomYear = Math.floor(Math.random() * (currentYear - 1990 + 1)) + 1990;
    const randomPage = Math.floor(Math.random() * 20) + 1;
    
    const config = {
      params: {
        api_key: API_KEY,
        primary_release_year: randomYear,
        page: randomPage,
        sort_by: 'popularity.desc',
        'vote_count.gte': 100,
      },
    };
    
    const res = await axios(`${BASE_URL}/discover/movie`, config);
    
    if (res.data.results && res.data.results.length > 0) {
      const shuffled = res.data.results.sort(() => 0.5 - Math.random());
      const randomMovies = shuffled.slice(0, 10);
      await display(randomMovies);
    } else {
      showNoResults();
    }
    
  } catch (err) {
    console.error("Error fetching random movies by year:", err);
    showError("Failed to fetch random movies. Please try again.");
  } finally {
    showLoader(false);
  }
};

// Enhanced random function with multiple strategies
const GetRandomMoviesAdvanced = async () => {
  const strategies = [
    GetRandomMovies,           // General random
    GetRandomMoviesByGenre,    // Genre-based
    GetRandomMoviesByYear      // Year-based
  ];
  
  // Randomly pick a strategy
  const randomStrategy = strategies[Math.floor(Math.random() * strategies.length)];
  await randomStrategy();
};

// Method 4: Using trending movies (Most current)
const GetTrendingMovies = async () => {
  showLoader(true);
  clearResults();

  try {
    // Get trending movies for the week
    const config = {
      params: {
        api_key: API_KEY,
      },
    };
    
    const res = await axios(`${BASE_URL}/trending/movie/week`, config);
    
    if (res.data.results && res.data.results.length > 0) {
      // Shuffle trending movies
      const shuffled = res.data.results.sort(() => 0.5 - Math.random());
      const randomMovies = shuffled.slice(0, 8);
      await display(randomMovies);
    } else {
      showNoResults();
    }
    
  } catch (err) {
    console.error("Error fetching trending movies:", err);
    showError("Failed to fetch trending movies. Please try again.");
  } finally {
    showLoader(false);
  }
};
