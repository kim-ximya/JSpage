const weatherText = document.querySelector("#weather span");

function getWeatherDescription(code) {
  const descriptions = {
    0: "맑음",
    1: "대체로 맑음",
    2: "부분적으로 흐림",
    3: "흐림",
    45: "안개",
    48: "안개",
    51: "이슬비",
    53: "이슬비",
    55: "이슬비",
    56: "어는 이슬비",
    57: "어는 이슬비",
    61: "비",
    63: "비",
    65: "비",
    66: "어는 비",
    67: "어는 비",
    71: "눈",
    73: "눈",
    75: "눈",
    77: "싸락눈",
    80: "소나기",
    81: "소나기",
    82: "소나기",
    85: "눈 소나기",
    86: "눈 소나기",
    95: "천둥번개",
    96: "우박을 동반한 천둥번개",
    99: "우박을 동반한 천둥번개",
  };

  return descriptions[code] ?? "날씨 정보 없음";
}

async function onGeoOk(position) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(position.coords.latitude),
    longitude: String(position.coords.longitude),
    current: "temperature_2m,weather_code",
    timezone: "auto",
  }).toString();

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather request failed: ${response.status}`);
    }

    const data = await response.json();
    const temperature = data.current?.temperature_2m;
    const weatherCode = data.current?.weather_code;

    if (!Number.isFinite(temperature) || !Number.isFinite(weatherCode)) {
      throw new Error("Weather response is incomplete.");
    }

    const unit = data.current_units?.temperature_2m ?? "°C";
    const description = getWeatherDescription(weatherCode);
    weatherText.innerText = `#현재 위치 #${description} #${Math.round(temperature)}${unit}`;
  } catch (error) {
    console.error(error);
    weatherText.innerText = "#날씨 정보를 불러올 수 없음";
  }
}

function onGeoError() {
  weatherText.innerText = "#날씨를 보려면 위치 권한이 필요합니다";
}

if ("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition(onGeoOk, onGeoError);
} else {
  onGeoError();
}
