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

function formatCoordinates(latitude, longitude) {
  return `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
}

async function getLocationName(latitude, longitude) {
  const url = new URL(
    "https://api.bigdatacloud.net/data/reverse-geocode-client"
  );
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    localityLanguage: navigator.language?.split("-")[0] ?? "ko",
  }).toString();

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Location request failed: ${response.status}`);
  }

  const data = await response.json();
  const place = data.city || data.locality;
  const region = data.principalSubdivision;
  const locationParts = [place, region].filter(
    (part, index, parts) => part && parts.indexOf(part) === index
  );

  if (locationParts.length === 0) {
    throw new Error("Location response is incomplete.");
  }

  return locationParts.join(", ");
}

async function onGeoOk(position) {
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,weather_code",
    timezone: "auto",
  }).toString();

  const locationNamePromise = getLocationName(latitude, longitude).catch(
    (error) => {
      console.error(error);
      return formatCoordinates(latitude, longitude);
    }
  );

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
    const locationName = await locationNamePromise;
    weatherText.innerText = `#${locationName} #${description} #${Math.round(temperature)}${unit}`;
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
