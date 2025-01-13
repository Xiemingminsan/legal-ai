
async function summarizeWithGemini(conversationText) {
    const prompt = `Summarize the following conversation concisely:\n\n${conversationText}\n\nSummary:`;
    const payload = {
      contents: [{
        parts: [{ text: prompt }]
      }]
    };
    const headers = { "Content-Type": "application/json" };

    console.log(payload)
  
    try {
      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        payload,
        { headers }
      );

      console.log(response)
      console.log(response.data)
      if (response.status === 200) {
        const data = response.data;
        console.log("Gemini API response:", data);
        const candidates = data.candidates || [];
        if (candidates.length) {
          return candidates[0].content.parts[0].text.trim();
        }
      }
    } catch (e) {
    }
    return "";
  }
  
  module.exports = { summarizeWithGemini };
  