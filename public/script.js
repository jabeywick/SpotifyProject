async function updateScreen() {
  const widthAndHeight = "105px";

  const resTracks = await fetch("/api/top-tracks");
  const songList = document.getElementById("songList");
  songList.innerHTML = "";

  if (!resTracks.ok) {
    const li = document.createElement("li");
    const errorBody = await resTracks.json().catch(() => ({}));

    songList.insertAdjacentHTML(
      "afterend",
      `
      <div class="errorCard">
      <img src="errorIcon.png" alt="error" class="errorIcon" width=125px height=125px
      <p class="errorText">${`Error fetching API data`}</p>
      </div>`,
    );

    throw new Error(
      `Spotify API Error: ${resTracks.status} - ${
        errorBody.error?.message || resTracks.statusText
      }`,
    );
  }
  const topTracks = await resTracks.json();
  console.log(topTracks);

  topTracks?.forEach((element) => {
    const li = document.createElement("li");
    li.innerHTML = `<div class="artist-card">
      <img src=${element.album?.images?.[0]?.url} width=${widthAndHeight} height=${widthAndHeight} class= "albumArt"></img>
      <div class="textOnCard">
      <p class="songName">${element.name}</p>
      <p class="songArtist">${element.artists?.[0]?.name}</p>
      </div>
    </div>`;

    songList.appendChild(li);
  });
}

updateScreen();
