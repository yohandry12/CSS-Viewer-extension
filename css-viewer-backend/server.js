// Fichier: server.js
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors()); // Autoriser les requêtes depuis votre extension

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

// --- L'ENDPOINT POUR L'ANALYSE CSS ---
app.post("/api/analyze-css", async (req, res) => {
  const { cssCode } = req.body;

  if (!cssCode) {
    return res
      .status(400)
      .json({ success: false, message: "Le code CSS est requis." });
  }
  if (!DEEPSEEK_API_KEY) {
    return res
      .status(500)
      .json({
        success: false,
        message: "La clé API DeepSeek n'est pas configurée.",
      });
  }

  const system_prompt = `
      Tu es un expert senior en développement frontend, spécialisé dans l'audit de code CSS.
      Analyse le code CSS suivant et fournis des suggestions d'amélioration concrètes et utiles.
      Ta réponse doit être UNIQUEMENT un objet JSON valide, sans aucun texte avant ou après.
      Le JSON doit avoir la structure suivante :
      {
        "accessibility": "Une suggestion pour améliorer l'accessibilité (contraste, taille de police, etc.). Si tout est bon, dis-le.",
        "performance": "Une suggestion pour améliorer la performance (sélecteurs complexes, animations, etc.). Si tout est bon, dis-le.",
        "modernization": "Une suggestion pour moderniser le code (utiliser flex/grid au lieu de float, variables CSS, etc.). Si tout est bon, dis-le."
      }
      Sois concis et va droit au but.
    `;

  const user_prompt = `Analyse ce bloc de CSS :\n\n${cssCode}`;

  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: system_prompt },
          { role: "user", content: user_prompt },
        ],
        response_format: { type: "json_object" }, // Demander explicitement un JSON
        temperature: 0.5,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
      }
    );

    const aiResponseContent = response.data.choices[0].message.content;
    const suggestions = JSON.parse(aiResponseContent);

    res.status(200).json({ success: true, data: suggestions });
  } catch (error) {
    console.error(
      "Erreur API DeepSeek:",
      error.response ? error.response.data : error.message
    );
    res
      .status(500)
      .json({ success: false, message: "Erreur lors de l'analyse du CSS." });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(
    `Serveur d'API pour l'IA CSS Viewer démarré sur http://localhost:${PORT}`
  );
});
