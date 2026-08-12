// Gemini Spec Analyzer

let currentDevice = "pc";

const deviceButtons = document.querySelectorAll(".device-button");
const pcSpecs = document.getElementById("pcSpecs");
const phoneSpecs = document.getElementById("phoneSpecs");
const askButton = document.getElementById("askButton");
const questionInput = document.getElementById("question");
const results = document.getElementById("results");
const clearResultsButton = document.getElementById("clearResults");


// Device selection
deviceButtons.forEach((button) => {
    button.addEventListener("click", () => {
        currentDevice = button.dataset.device;

        deviceButtons.forEach((item) => item.classList.remove("active"));
        button.classList.add("active");

        if (currentDevice === "pc") {
            pcSpecs.classList.remove("hidden");
            phoneSpecs.classList.add("hidden");
        } else {
            pcSpecs.classList.add("hidden");
            phoneSpecs.classList.remove("hidden");
        }
    });
});


// Collect specifications
function getDeviceSpecs() {
    if (currentDevice === "pc") {
        return {
            deviceType: "PC/Laptop",
            cpu: document.getElementById("cpu").value.trim(),
            gpu: document.getElementById("gpu").value.trim(),
            ram: document.getElementById("ram").value.trim(),
            storage: document.getElementById("storage").value.trim(),
            psuOrBattery: document.getElementById("psuOrBattery").value.trim()
        };
    }

    return {
        deviceType: "Phone",
        screen: document.getElementById("phoneScreen").value.trim(),
        cpu: document.getElementById("phoneCpu").value.trim(),
        ram: document.getElementById("phoneRam").value.trim(),
        storage: document.getElementById("phoneStorage").value.trim(),
        cameras: document.getElementById("phoneCameras").value.trim(),
        battery: document.getElementById("phoneBattery").value.trim()
    };
}


// Create prompt
function createPrompt(specs, userQuestion, language) {
    const specsSummary = specs.deviceType === "Phone"
        ? `Phone: Screen(${specs.screen}), CPU(${specs.cpu}), RAM(${specs.ram}), Storage(${specs.storage}), Camera(${specs.cameras}), Battery(${specs.battery})`
        : `PC/Laptop: CPU(${specs.cpu}), GPU(${specs.gpu}), RAM(${specs.ram}), Storage(${specs.storage}), PSU/Battery(${specs.psuOrBattery})`;

    return `
You are a technical hardware performance analyzer.

Device specifications:
${specsSummary}

User question:
"${userQuestion}"

Answer language:
${language === "ar" ? "Arabic" : "English"}

Return ONLY valid JSON:
{
  "score": 85,
  "rating": "Excellent",
  "analysis": "Short technical analysis"
}

Rules:
- score is an integer from 0 to 100.
- rating must be Excellent, Good, Average, or Poor.
- analysis should be concise and technically useful.
- Base the result on the hardware and the user's question.
- Do not return Markdown or text outside the JSON.
`.trim();
}


// Ask Gemini
askButton.addEventListener("click", async () => {
    const question = questionInput.value.trim();

    if (!question) {
        addMessage("Please enter a question first.");
        return;
    }

    const specs = getDeviceSpecs();
    const language = document.getElementById("language").value;

    // Direct browser API call, as requested.
    // WARNING: The API key is visible to website visitors.
    const API_KEY = "YOUR_GEMINI_API_KEY";

    if (!API_KEY || API_KEY === "YOUR_GEMINI_API_KEY") {
        addMessage("Please add your Gemini API key inside script.js first.");
        return;
    }

    askButton.disabled = true;
    askButton.textContent = "Analyzing...";

    const loadingCard = addMessage(
        language === "ar"
            ? "جاري تحليل الجهاز..."
            : "Gemini is analyzing your device..."
    );

    try {
        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": API_KEY
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: createPrompt(specs, question, language)
                        }]
                    }],
                    generationConfig: {
                        responseMimeType: "application/json"
                    }
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data?.error?.message || `Gemini API error (${response.status})`
            );
        }

        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error("Gemini returned an empty response.");
        }

        const analysisData = JSON.parse(text);

        // Remove only the temporary loading card.
        loadingCard.remove();

        // Add the new analysis without touching previous analyses.
        addAnalysis(analysisData, question, language);

    } catch (error) {
        loadingCard.remove();

        addMessage(
            language === "ar"
                ? `خطأ في Gemini:\n\n${error.message}`
                : `Gemini Error:\n\n${error.message}`
        );
    } finally {
        askButton.disabled = false;
        askButton.textContent = "Ask Gemini";
    }
});


// Add a new analysis card
function addAnalysis(data, question, language) {
    let score = Number(data.score);

    if (!Number.isFinite(score)) {
        score = 0;
    }

    score = Math.max(0, Math.min(100, Math.round(score)));

    const rating = data.rating || "Unknown";
    const analysis = data.analysis || "No analysis available.";

    const card = document.createElement("article");
    card.className = "analysis-card";

    card.innerHTML = `
        <h3>Analysis #${results.children.length + 1}</h3>

        <div class="analysis-question">
            <strong>Question:</strong>
            ${escapeHtml(question)}
        </div>

        <div class="analysis-score">
            <div class="score-number">${score}%</div>
            <div class="score-label">Performance Score</div>
        </div>

        <div class="analysis-rating">
            Rating: ${escapeHtml(rating)}
        </div>

        <div class="analysis-text">
            ${escapeHtml(analysis)}
        </div>
    `;

    results.appendChild(card);

    // Automatically show the newest result.
    card.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


// Add a normal message card
function addMessage(message) {
    const card = document.createElement("article");
    card.className = "analysis-card";

    card.innerHTML = `
        <div class="analysis-text">
            ${escapeHtml(message)}
        </div>
    `;

    results.appendChild(card);
    return card;
}


// Clear all previous analyses
clearResultsButton.addEventListener("click", () => {
    results.innerHTML = "";
});


// Protect displayed AI text from being interpreted as HTML
function escapeHtml(text) {
    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
