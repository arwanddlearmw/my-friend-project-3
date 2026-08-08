from pathlib import Path

path = Path("/mnt/data/script.js")
js = path.read_text(encoding="utf-8")

old = '''    // For now we only display the generated prompt.
    // The Gemini API call should be handled by a backend
    // so the API key is not exposed in browser JavaScript.
    const prompt = createPrompt(specs, question, language);

    showResult(
        "Request prepared successfully.\\n\\n" +
        "Device: " + specs.deviceType +
        "\\n\\nPrompt:\\n" + prompt
    );'''

new = '''    const prompt = createPrompt(specs, question, language);

    // ضع مفتاح Gemini هنا.
    // ملاحظة: هذا مناسب للتجربة المحلية فقط، لأن المفتاح سيكون ظاهرًا
    // في JavaScript ويمكن لأي شخص يملك الصفحة الوصول إليه.
    const API_KEY = "YOUR_GEMINI_API_KEY";

    if (API_KEY === "YOUR_GEMINI_API_KEY" || !API_KEY.trim()) {
        showResult("Please add your Gemini API key inside script.js first.");
        return;
    }

    askButton.disabled = true;
    askButton.textContent = "Asking Gemini...";
    showResult("Gemini is thinking...");

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
                                    text: prompt
                                }
                            ]
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            const errorMessage =
                data?.error?.message ||
                `Gemini API error (${response.status})`;

            throw new Error(errorMessage);
        }

        const text =
            data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error("Empty AI response.");
        }

        showResult(text);
    } catch (error) {
        showResult("Gemini Error:\\n\\n" + error.message);
    } finally {
        askButton.disabled = false;
        askButton.textContent = "Ask Gemini";
    }'''

if old not in js:
    raise RuntimeError("Expected section was not found in script.js")

path.write_text(js.replace(old, new), encoding="utf-8")
print(f"Updated: {path}")
