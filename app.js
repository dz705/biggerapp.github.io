const plans = {
  reset: {
    low: [
      ["Arrive", "Find a quiet spot and put your phone face-down.", "◎"],
      ["Breathe", "Try slow box breathing and let your shoulders drop.", "◇"],
      ["Reset", "Take a short, screen-free walk or stretch.", "↝"]
    ],
    steady: [
      ["Settle", "Grab water and choose a low-traffic place to pause.", "◎"],
      ["Move", "Walk one easy loop without checking notifications.", "↝"],
      ["Land", "Write one sentence about what matters next.", "◇"]
    ],
    high: [
      ["Aim", "Decide what would make you feel refreshed before class.", "◎"],
      ["Move", "Take a brisk lap or climb a few flights of stairs.", "↝"],
      ["Center", "Sit, breathe, and choose your next priority.", "◇"]
    ]
  },
  study: {
    low: [
      ["Set up", "Open one class and choose the smallest useful task.", "◎"],
      ["Review", "Read notes or flashcards—no new hard material.", "◇"],
      ["Capture", "Write the next question to solve later.", "↗"]
    ],
    steady: [
      ["Choose", "Pick one concrete outcome for this study block.", "◎"],
      ["Focus", "Work on that one thing with notifications off.", "◇"],
      ["Close", "Write a one-line summary and your next step.", "↗"]
    ],
    high: [
      ["Aim", "Choose the hardest small problem you can finish now.", "◎"],
      ["Sprint", "Work fast on one assignment or practice set.", "◇"],
      ["Check", "Review your answer and note any loose ends.", "↗"]
    ]
  },
  admin: {
    low: [
      ["Scan", "Check your calendar for the next two days.", "◎"],
      ["Clear", "Answer one easy message or email.", "◇"],
      ["List", "Write tomorrow’s top three—not the whole backlog.", "↗"]
    ],
    steady: [
      ["Triage", "Choose one overdue or time-sensitive loose end.", "◎"],
      ["Handle", "Send, schedule, submit, or book that one thing.", "◇"],
      ["Preview", "Check tomorrow’s calendar and pack-list.", "↗"]
    ],
    high: [
      ["Sweep", "Collect small tasks that take under five minutes.", "◎"],
      ["Batch", "Complete as many as you can without switching apps.", "◇"],
      ["Reset", "Clean your downloads or backpack for a fresh start.", "↗"]
    ]
  }
};

const labels = {
  reset: "reset",
  study: "study",
  admin: "life-admin",
  low: "gentle",
  steady: "calm",
  high: "high-energy"
};

const WEATHER_KEY = "gapcraft-weather";
const HISTORY_KEY = "gapcraft-history";

const gapForm = document.querySelector("#gapForm");
const weatherForm = document.querySelector("#weatherForm");
const cityInput = document.querySelector("#cityInput");
const weatherStatus = document.querySelector("#weatherStatus");
const weatherCard = document.querySelector("#weatherCard");
const weatherIcon = document.querySelector("#weatherIcon");
const weatherLocation = document.querySelector("#weatherLocation");
const weatherTemp = document.querySelector("#weatherTemp");
const weatherDescription = document.querySelector("#weatherDescription");
const weatherFeels = document.querySelector("#weatherFeels");
const weatherWind = document.querySelector("#weatherWind");
const planSection = document.querySelector("#planSection");
const planTitle = document.querySelector("#plan-title");
const planContext = document.querySelector("#planContext");
const taskList = document.querySelector("#taskList");
const timerDisplay = document.querySelector("#timerDisplay");
const timerBar = document.querySelector("#timerBar");
const timerButton = document.querySelector("#timerButton");
const resetButton = document.querySelector("#resetButton");
const completeButton = document.querySelector("#completeButton");
const streakCount = document.querySelector("#streakCount");
const historyList = document.querySelector("#historyList");
const historyEmpty = document.querySelector("#historyEmpty");
const clearHistory = document.querySelector("#clearHistory");
const toast = document.querySelector("#toast");

let totalSeconds = 30 * 60;
let remainingSeconds = totalSeconds;
let timerId = null;
let currentPlanKey = "30-steady-study";
let currentPlan = { minutes: 30, energy: "steady", goal: "study" };
let currentWeather = readJson(WEATHER_KEY, null);

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getSavedCount() {
  return Number(localStorage.getItem("gapcraft-count") || 0);
}

function setSavedCount(value) {
  localStorage.setItem("gapcraft-count", String(value));
  streakCount.textContent = value;
}

function allocateMinutes(total) {
  const usable = Math.max(total - 2, 3);
  const first = Math.max(2, Math.round(usable * 0.18));
  const third = Math.max(2, Math.round(usable * 0.2));
  return [first, usable - first - third, third];
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

function updateTimerUI() {
  timerDisplay.textContent = formatTime(remainingSeconds);
  const progress = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
  timerBar.style.width = `${progress}%`;
  document.title = timerId ? `${formatTime(remainingSeconds)} — GapCraft Plus` : "GapCraft Plus — Weather-aware mini-plans";
}

function stopTimer() {
  window.clearInterval(timerId);
  timerId = null;
  timerButton.textContent = "Start timer";
  timerButton.classList.remove("is-running");
}

function resetTimer() {
  stopTimer();
  remainingSeconds = totalSeconds;
  updateTimerUI();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove("show"), 2800);
}

function describeWeather(code) {
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code === 45 || code === 48) return "Foggy";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code >= 85 && code <= 86) return "Snow showers";
  if (code >= 95) return "Thunderstorms";
  return "Mixed conditions";
}

function weatherSymbol(code) {
  if (code === 0) return "☀";
  if (code <= 3) return "◒";
  if (code === 45 || code === 48) return "≋";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "☂";
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "✳";
  if (code >= 95) return "ϟ";
  return "◌";
}

function isOutdoorWeather(weather) {
  return weather && weather.code <= 3 && weather.precipitation <= 0.1 && weather.temperature >= 45 && weather.temperature <= 88 && weather.wind <= 20;
}

function renderWeather(weather, saved = false) {
  if (!weather) return;
  weatherCard.classList.remove("is-empty");
  weatherIcon.textContent = weatherSymbol(weather.code);
  weatherLocation.textContent = weather.location;
  weatherTemp.textContent = `${Math.round(weather.temperature)}°`;
  weatherDescription.textContent = describeWeather(weather.code);
  weatherFeels.textContent = `${Math.round(weather.feels)}°`;
  weatherWind.textContent = `${Math.round(weather.wind)} mph`;
  cityInput.value = weather.search || weather.location;
  weatherStatus.classList.remove("is-error");
  weatherStatus.textContent = saved ? "Showing the last weather saved on this device." : "Weather added—your next reset plan will adapt to it.";
}

async function fetchWeather(city) {
  const submitButton = weatherForm.querySelector("button");
  submitButton.disabled = true;
  submitButton.textContent = "Checking…";
  weatherStatus.classList.remove("is-error");
  weatherStatus.textContent = `Looking up ${city}…`;

  try {
    const geocodeUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
    geocodeUrl.search = new URLSearchParams({ name: city, count: "1", language: "en", format: "json" });
    const geocodeResponse = await fetch(geocodeUrl);
    if (!geocodeResponse.ok) throw new Error("Location search failed");
    const geocode = await geocodeResponse.json();
    const place = geocode.results?.[0];
    if (!place) throw new Error("No matching city found");

    const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
    forecastUrl.search = new URLSearchParams({
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      current: "temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
      temperature_unit: "fahrenheit",
      wind_speed_unit: "mph",
      timezone: "auto"
    });
    const forecastResponse = await fetch(forecastUrl);
    if (!forecastResponse.ok) throw new Error("Weather lookup failed");
    const forecast = await forecastResponse.json();

    currentWeather = {
      search: city,
      location: [place.name, place.admin1, place.country_code].filter(Boolean).join(", "),
      temperature: forecast.current.temperature_2m,
      feels: forecast.current.apparent_temperature,
      precipitation: forecast.current.precipitation,
      code: forecast.current.weather_code,
      wind: forecast.current.wind_speed_10m,
      checkedAt: Date.now()
    };
    writeJson(WEATHER_KEY, currentWeather);
    renderWeather(currentWeather);
    renderPlan(currentPlan.minutes, currentPlan.energy, currentPlan.goal, false);
  } catch (error) {
    if (currentWeather) {
      renderWeather(currentWeather, true);
      weatherStatus.textContent = "Couldn’t refresh. Showing your last saved weather instead.";
    } else {
      weatherStatus.classList.add("is-error");
      weatherStatus.textContent = error.message === "No matching city found" ? "That city wasn’t found. Try adding a state or country." : "Weather is unavailable right now. You can still craft a plan.";
    }
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Check weather";
  }
}

function tasksFor(goal, energy) {
  const tasks = plans[goal][energy].map((task) => [...task]);
  if (goal !== "reset" || !currentWeather) return tasks;

  if (isOutdoorWeather(currentWeather)) {
    tasks[1] = ["Step outside", `${Math.round(currentWeather.temperature)}° and ${describeWeather(currentWeather.code).toLowerCase()}—take a phone-free campus loop.`, "☀"];
  } else {
    tasks[1] = ["Stay sheltered", `${describeWeather(currentWeather.code)} right now—walk an indoor loop or stretch somewhere quiet.`, "⌂"];
  }
  return tasks;
}

function renderPlan(minutes, energy, goal, resetCompletion = true) {
  const tasks = tasksFor(goal, energy);
  const times = allocateMinutes(minutes);
  currentPlan = { minutes, energy, goal };

  planTitle.textContent = `A ${labels[energy]} ${minutes}-minute ${labels[goal]} gap`;
  planContext.textContent = currentWeather
    ? `${describeWeather(currentWeather.code)} and ${Math.round(currentWeather.temperature)}° in ${currentWeather.location}. ${goal === "reset" ? (isOutdoorWeather(currentWeather) ? "Good conditions for a quick outdoor reset." : "This plan keeps your reset indoors.") : "Weather saved for your next reset plan."}`
    : "Built for the time and energy you have right now. Add weather above for an indoor or outdoor reset.";

  taskList.innerHTML = tasks.map((task, index) => `
    <li class="task-item">
      <span class="task-time">${times[index]} MIN</span>
      <div>
        <h3>${task[0]}</h3>
        <p>${task[1]}</p>
      </div>
      <span class="task-icon" aria-hidden="true">${task[2]}</span>
    </li>
  `).join("");

  totalSeconds = minutes * 60;
  remainingSeconds = totalSeconds;
  currentPlanKey = `${minutes}-${energy}-${goal}-${currentWeather?.checkedAt || "no-weather"}`;
  if (resetCompletion) {
    completeButton.disabled = false;
    completeButton.innerHTML = '<span aria-hidden="true">✓</span> Mark this gap complete';
  }
  resetTimer();
}

function getHistory() {
  return readJson(HISTORY_KEY, []);
}

function renderHistory() {
  const history = getHistory();
  historyList.innerHTML = history.map((item) => `
    <article class="history-item">
      <span class="history-check" aria-hidden="true">✓</span>
      <div>
        <h3>${item.title}</h3>
        <p>${item.date}</p>
        <div class="history-tags">
          <span>${item.energy}</span>
          <span>${item.goal}</span>
          ${item.weather ? `<span>${item.weather}</span>` : ""}
        </div>
      </div>
    </article>
  `).join("");
  historyEmpty.hidden = history.length > 0;
  clearHistory.disabled = history.length === 0;
}

function saveCurrentPlan() {
  const history = getHistory();
  history.unshift({
    id: Date.now(),
    title: planTitle.textContent,
    date: new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date()),
    energy: labels[currentPlan.energy],
    goal: labels[currentPlan.goal],
    weather: currentWeather ? `${Math.round(currentWeather.temperature)}° · ${describeWeather(currentWeather.code)}` : ""
  });
  writeJson(HISTORY_KEY, history.slice(0, 8));
  renderHistory();
}

weatherForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();
  if (city) fetchWeather(city);
});

gapForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(gapForm);
  renderPlan(Number(formData.get("minutes")), formData.get("energy"), formData.get("goal"));
  planSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

timerButton.addEventListener("click", () => {
  if (timerId) {
    stopTimer();
    timerButton.textContent = "Resume timer";
    return;
  }

  if (remainingSeconds === 0) remainingSeconds = totalSeconds;
  timerButton.textContent = "Pause timer";
  timerButton.classList.add("is-running");
  timerId = window.setInterval(() => {
    remainingSeconds -= 1;
    updateTimerUI();
    if (remainingSeconds <= 0) {
      remainingSeconds = 0;
      stopTimer();
      updateTimerUI();
      showToast("Gap complete. Nice work—time to head out!");
    }
  }, 1000);
});

resetButton.addEventListener("click", resetTimer);

completeButton.addEventListener("click", () => {
  const lastCompleted = sessionStorage.getItem("gapcraft-last-completed");
  if (lastCompleted === currentPlanKey) {
    showToast("This gap is already in your count.");
    return;
  }

  const nextCount = getSavedCount() + 1;
  setSavedCount(nextCount);
  saveCurrentPlan();
  sessionStorage.setItem("gapcraft-last-completed", currentPlanKey);
  completeButton.disabled = true;
  completeButton.innerHTML = '<span aria-hidden="true">✓</span> Gap completed';
  showToast(`Win banked—${nextCount} gap${nextCount === 1 ? "" : "s"} crafted!`);
});

clearHistory.addEventListener("click", () => {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
  showToast("Recent plan history cleared.");
});

streakCount.textContent = getSavedCount();
if (currentWeather) renderWeather(currentWeather, true);
renderHistory();
renderPlan(30, "steady", "study");
