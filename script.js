from pathlib import Path

js = r'''// Gemini Spec Analyzer

let currentDevice = "pc";

const deviceButtons = document.querySelectorAll(".device-button");
const pcSpecs = document.getElementById("pcSpecs");
const phoneSpecs = document.getElementById("phoneSpecs");
const askButton = document.getElementById("askButton");
const questionInput = document.getElementById("question");
const resultCard = document.getElementById("resultCard");
const result = document.getElementById("result");


// =========================
// Device selector
// =========================

deviceButtons.forEach((button) => {
    button.addEventListener("click", () => {
        currentDevice = button.dataset.device;

        deviceButtons.forEach((item) => {
            item.classList.remove("active");
        });

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


// =========================
// Get device specifications
// =========================

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


// =========================
// Create Gemini prompt
// =========================

function createPrompt(specs, userQuestion, language) {
    let specsSummary;

    if (specs.deviceType === "Phone") {
        specsSummary =
            `Phone: ` +
            `Screen(${specs.screen}), ` +
            `CPU(${specs.cpu}), ` +
            `RAM(${specs.ram}), ` +
            `Storage(${specs.storage}), ` +
            `Camera(${specs.cameras}), ` +
            `Battery(${specs.battery})`;
    } else {
        specsSummary =
            `PC/Laptop: ` +
            `CPU(${specs.cpu}), ` +
            `GPU(${specs.gpu}), ` +
            `RAM(${specs.ram}), ` +
            `Storage(${specs.storage}), ` +
            `PSU/Battery(${specs.psuOrBattery})`;
    }

    return `
You are a technical hardware performance analyzer.

Analyze the following device and answer the user's question.

Device specifications:
${specsSummary}

User question:
"${userQuestion}"

Response language:
${language === "ar" ? "Arabic" : "English"}

Return ONLY valid JSON.
Do not return Markdown.
Do not put the JSON inside code fences.
Do not add any text before or after the JSON.

Use exactly this structure:

{
  "score": 85,
  "rating": "Excellent",
  "analysis": "Short technical analysis here."
}

Rules:
- score must be an integer between 0 and 100.
- rating must be exactly one of:
  "Excellent", "Good", "Average", "Poor"
- score represents how well the device fits the user's question.
- Use real-world hardware knowledge and benchmarks when possible.
- Do not invent exact benchmark numbers unless reasonably known.
- analysis should be concise but useful.
- Answer the user's actual question, not just the specifications.
`.trim();
}


// =========================
// Ask Gemini
// =========================

askButton.addEventListener("click", async () => {
    const question = questionInput.value.trim();

    if (!question) {
        showMessage("Please enter a question first.");
        return;
    }

    const specs = getDeviceSpecs();
    const language = document.getElementById("language").value;

    // Put your Gemini API key here.
    // WARNING:
    // This exposes the API key to anyone who can access this website.
    const API_KEY = "YOUR_GEMINI_API_KEY";

    if (!API_KEY || API_KEY === "YOUR_GEMINI_API_KEY") {
        showMessage("Please add your Gemini API key inside script.js first.");
        return;
    }

    askButton.disabled = true;
    askButton.textContent = "Analyzing...";

    showMessage(
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
                    contents: [
                        {
                            parts: [
                                {
                                    text: createPrompt(
                                        specs,
                                        question,
                                        language
                                    )
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        responseMimeType: "application/json"
                    }
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data?.error?.message ||
                `Gemini API error (${response.status})`
            );
        }

        const text =
            data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error("Gemini returned an empty response.");
        }

        let analysisData;

        try {
            analysisData = JSON.parse(text);
        } catch (error) {
            throw new Error("Gemini returned invalid JSON.");
        }

        displayAnalysis(analysisData, language);

    } catch (error) {
        showMessage(
            language === "ar"
                ? `حدث خطأ أثناء الاتصال بـ Gemini:\n\n${error.message}`
                : `Gemini Error:\n\n${error.message}`
        );
    } finally {
        askButton.disabled = false;
        askButton.textContent = "Ask Gemini";
    }
});


// =========================
// Display analysis
// =========================

function displayAnalysis(data, language) {
    let score = Number(data.score);

    if (!Number.isFinite(score)) {
        score = 0;
    }

    score = Math.max(0, Math.min(100, Math.round(score)));

    const rating = data.rating || "Unknown";
    const analysis = data.analysis || "No analysis available.";

    const isArabic = language === "ar";

    resultCard.classList.remove("hidden");

    result.innerHTML = `
        <div class="analysis-score">
            <div class="score-number">${score}%</div>
            <div class="score-label">
                ${isArabic ? "نسبة التوافق" : "Performance Score"}
            </div>
        </div>

        <div class="analysis-rating">
            ${escapeHtml(
                translateRating(rating, isArabic)
            )}
        </div>

        <div class="analysis-text">
            ${escapeHtml(analysis)}
        </div>
    `;
}


// =========================
// Translate rating
// =========================

function translateRating(rating, isArabic) {
    if (!isArabic) {
        return rating;
    }

    const ratings = {
        Excellent: "ممتاز",
        Good: "جيد",
        Average: "متوسط",
        Poor: "ضعيف"
    };

    return ratings[rating] || rating;
}


// =========================
// Show message
// =========================

function showMessage(message) {
    resultCard.classList.remove("hidden");

    result.innerHTML = `
        <div class="analysis-text">
            ${escapeHtml(message)}
        </div>
    `;
}


// =========================
// Escape HTML
// =========================

function escapeHtml(text) {
    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
'''

path = Path("/mnt/data/script-new.js")
path.write_text(js, encoding="utf-8")

print(f"Created: {path}")
