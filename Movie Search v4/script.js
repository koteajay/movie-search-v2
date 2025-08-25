const form = document.querySelector("#form");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  GetMovies();
});

const loader = document.querySelector("#loader");

const GetMovies = async () => {
  const userSearch = document.querySelector("#text").value;
  if (!userSearch.trim()) return; // empty search skip

  loader.style.display = "block"; // show loader
  document.querySelector("#results").innerHTML = "";

  try {
    const config = {
      params: {
        api_key: "c47184553e058b7c3110d774ac2d6723",
        query: userSearch,
      },
    };
    const res = await axios("https://api.themoviedb.org/3/search/movie", config);
    display(res.data.results);
  } catch (err) {
    console.error(err);
  } finally {
    loader.style.display = "none"; // hide loader
  }
};


const display = async (arr) => {
  const results = document.querySelector("#results");
  results.innerHTML = "";
  if (!arr || arr.length === 0) {
    results.innerHTML = `<p class="has-text-grey-light">No movies found 🔍</p>`;
    return;
  }

  const providers = await Promise.all(arr.map(val => getprovider(val.id)));



  arr.forEach((val,i)=> {
    const column = document.createElement("div");
    column.className = "column is-12-mobile is-6-tablet is-4-desktop";
    const provider = providers[i];

    let providerHtml = "";

    if (Array.isArray(provider) && provider.length>0) {
      providerHtml =
        '<p><strong>Where to watch:</strong></p><div class="provider-container">';
      for (let p of provider) {
        providerHtml += `
            <div class="provider">
                <img src="${p.logo}" alt="${p.name}" title="${p.name}" />
                <p>${p.name}</p>
            </div>
        `;
      }
      providerHtml += "</div>";
    } else {
      providerHtml = `<p><strong>Where to watch:</strong> Not available</p>`;
    }

    const card = document.createElement("div");
    card.className = "card mb-4 equal-height";
    card.style.maxWidth = "400px";
    card.style.margin = "auto";

    //overveiw
    const overview = val.overview? val.overview.substring(0, 50) + "...": "No description available";
    const cardContent = `
        <div class="card-image">
        <figure class="image is-3by2">
        <img src="https://image.tmdb.org/t/p/w780${
          val.poster_path || ""
        }" alt="${
      val.title
    }" style="object-fit: cover; height: 250px; width: 100%;" loading="lazy"/>
        </figure>
        </div>
        <div class="card-content">
        <p class="title is-4">${val.title}</p>
        <p><strong>Rating:</strong> ${val.vote_average || "N/A"} ⭐</p>
        <p>${overview}</p>
        ${providerHtml}
        </div>`;

    card.innerHTML = cardContent;

    column.appendChild(card);
    results.appendChild(column);
  })
};

const getprovider = async (id) => {
  const config = {
    params: {
      api_key: "c47184553e058b7c3110d774ac2d6723",
    },
  };
  const res = await axios(
    `https://api.themoviedb.org/3/movie/${id}/watch/providers`,
    config
  );
  const indianData = res.data.results.IN;

  if (!indianData || !indianData.flatrate) {
    return [];  // <-- empty array instead of string
  }

  return indianData.flatrate.map((p) => ({
    name: p.provider_name,
    logo: `https://image.tmdb.org/t/p/w45${p.logo_path}`,
  }));
};

