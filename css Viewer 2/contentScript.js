// // Empêche le script de s'exécuter plusieurs fois
// if (!window.cssViewerInitialized) {
//   window.cssViewerInitialized = true;

//   let inspectorActive = true;
//   let isFrozen = false;
//   let currentTarget = null;
//   let highlight, inspectorPanel;

//   // --- Fonctions d'Initialisation ---
//   function init() {
//     createUI();
//     addEventListeners();
//     // Sauvegarder l'état activé
//     chrome.storage.session.set({ inspectorEnabled: true });
//   }

//   function createUI() {
//     highlight = document.createElement("div");
//     highlight.id = "csv-highlight";

//     inspectorPanel = document.createElement("div");
//     inspectorPanel.id = "csv-inspector-panel";
//     inspectorPanel.innerHTML = `
//             <div class="csv-panel-header">
//                 <span class="csv-panel-title">CSS Viewer Pro</span>
//                 <span class="csv-panel-close" title="Désactiver (Echap)">&times;</span>
//             </div>
//             <div class="csv-panel-content">
//                 <p>Survolez un élément pour l'inspecter.</p>
//             </div>
//         `;
//     document.body.appendChild(highlight);
//     document.body.appendChild(inspectorPanel);

//     // Rendre le panneau interactif
//     inspectorPanel.style.pointerEvents = "auto";
//   }

//   function addEventListeners() {
//     // Utiliser capture pour s'assurer que l'événement est capturé
//     document.addEventListener("mouseover", handleMouseOver, true);
//     document.addEventListener("keydown", handleKeyDown);
//     inspectorPanel.addEventListener("click", handlePanelClick);
//     makeDraggable(inspectorPanel.querySelector(".csv-panel-header"));
//   }

//   // --- Gestionnaires d'Événements ---

//   function handleMouseOver(e) {
//     if (!inspectorActive || isFrozen) return;

//     // Ignorer les éléments de l'inspecteur lui-même
//     if (
//       e.target.closest("#csv-inspector-panel") ||
//       e.target.closest("#csv-highlight")
//     ) {
//       return;
//     }

//     currentTarget = e.target;
//     updateHighlight(currentTarget);
//     updatePanel(currentTarget);

//     // Empêcher la propagation pour éviter les conflits
//     e.stopPropagation();
//   }

//   function handleKeyDown(e) {
//     // Appuyer sur "Maj" pour figer/dégeler l'inspecteur
//     if (e.key === "Shift") {
//       e.preventDefault();
//       isFrozen = !isFrozen;
//       highlight.style.borderColor = isFrozen ? "#FFD166" : "#448aff";

//       // Mettre à jour le titre du panneau
//       const title = inspectorPanel.querySelector(".csv-panel-title");
//       title.textContent = isFrozen ? "CSS Viewer Pro (Figé)" : "CSS Viewer Pro";
//     }
//     // Appuyer sur "Echap" pour désactiver l'outil
//     if (e.key === "Escape") {
//       e.preventDefault();
//       deactivate();
//     }
//   }

//   function handlePanelClick(e) {
//     // Clic sur le bouton de fermeture
//     if (e.target.classList.contains("csv-panel-close")) {
//       deactivate();
//       return;
//     }

//     // Clic sur une propriété pour la copier
//     const propElement = e.target.closest(".csv-style-property");
//     if (propElement) {
//       const propName = propElement.dataset.prop;
//       const propValue = propElement.dataset.value;
//       if (propName && propValue) {
//         copyToClipboard(`${propName}: ${propValue};`);
//       }
//     }
//   }

//   // --- Fonctions de Mise à Jour de l'UI ---

//   function updateHighlight(element) {
//     const rect = element.getBoundingClientRect();
//     highlight.style.display = "block";
//     highlight.style.width = `${rect.width}px`;
//     highlight.style.height = `${rect.height}px`;
//     highlight.style.top = `${rect.top + window.scrollY}px`;
//     highlight.style.left = `${rect.left + window.scrollX}px`;
//   }

//   function updatePanel(element) {
//     const styles = window.getComputedStyle(element);
//     const contentDiv = inspectorPanel.querySelector(".csv-panel-content");

//     // Obtenir des informations sur l'élément
//     const elementInfo = getElementInfo(element);
//     const fontStyles = getStylesGroup(styles, [
//       "font-family",
//       "font-size",
//       "font-weight",
//       "font-style",
//       "line-height",
//       "color",
//       "text-align",
//     ]);
//     const boxModelStyles = getBoxModelStyles(styles);
//     const layoutStyles = getStylesGroup(styles, [
//       "display",
//       "position",
//       "z-index",
//       "top",
//       "left",
//       "right",
//       "bottom",
//       "float",
//       "clear",
//     ]);
//     const backgroundStyles = getStylesGroup(styles, [
//       "background-color",
//       "background-image",
//       "background-size",
//       "background-position",
//     ]);

//     contentDiv.innerHTML = `
//             ${createElementInfoHTML(elementInfo)}
//             ${createGroupHTML("Typographie", fontStyles)}
//             ${createGroupHTML("Modèle de Boîte", boxModelStyles)}
//             ${createGroupHTML("Positionnement", layoutStyles)}
//             ${createGroupHTML("Arrière-plan", backgroundStyles)}
//         `;
//   }

//   // --- Fonctions Utilitaires ---

//   function getElementInfo(element) {
//     const info = [];
//     info.push({ prop: "Tag", value: element.tagName.toLowerCase() });

//     if (element.id) {
//       info.push({ prop: "ID", value: `#${element.id}` });
//     }

//     if (element.className) {
//       const classes = element.className
//         .split(" ")
//         .filter((c) => c.trim())
//         .join(" ");
//       if (classes) {
//         info.push({
//           prop: "Classes",
//           value: `.${classes.split(" ").join(" .")}`,
//         });
//       }
//     }

//     return info;
//   }

//   function getStylesGroup(styles, properties) {
//     const result = [];
//     for (const prop of properties) {
//       const value = styles.getPropertyValue(prop);
//       if (
//         value &&
//         value !== "none" &&
//         value !== "0px" &&
//         value !== "auto" &&
//         value !== "normal"
//       ) {
//         result.push({ prop, value });
//       }
//     }
//     return result;
//   }

//   function getBoxModelStyles(styles) {
//     const result = [];
//     const dimensions = ["width", "height"];
//     const spacing = ["margin", "padding"];
//     const border = ["border-width", "border-style", "border-color"];

//     // Dimensions
//     for (const prop of dimensions) {
//       const value = styles.getPropertyValue(prop);
//       if (value && value !== "auto" && value !== "0px") {
//         result.push({ prop, value });
//       }
//     }

//     // Espacement
//     for (const prop of spacing) {
//       const value = styles.getPropertyValue(prop);
//       if (value && value !== "0px") {
//         result.push({ prop, value });
//       }
//     }

//     // Bordures
//     for (const prop of border) {
//       const value = styles.getPropertyValue(prop);
//       if (value && value !== "none" && value !== "0px") {
//         result.push({ prop, value });
//       }
//     }

//     return result;
//   }

//   function createElementInfoHTML(data) {
//     const propertiesHTML = data
//       .map(
//         (item) => `
//             <div class="csv-element-info">
//                 <span class="csv-prop-name">${item.prop}</span>
//                 <span class="csv-prop-value">${item.value}</span>
//             </div>
//         `
//       )
//       .join("");
//     return `
//             <div class="csv-element-section">
//                 <h3>Élément</h3>
//                 ${propertiesHTML}
//             </div>
//         `;
//   }

//   function createGroupHTML(title, data) {
//     if (data.length === 0) return "";

//     const propertiesHTML = data
//       .map(
//         (item) => `
//             <div class="csv-style-property" data-prop="${item.prop}" data-value="${item.value}">
//                 <span class="csv-prop-name">${item.prop}</span>
//                 <span class="csv-prop-value">${item.value}</span>
//             </div>
//         `
//       )
//       .join("");
//     return `
//             <div class="csv-style-group">
//                 <h3>${title}</h3>
//                 ${propertiesHTML}
//             </div>
//         `;
//   }

//   function copyToClipboard(text) {
//     if (navigator.clipboard && navigator.clipboard.writeText) {
//       navigator.clipboard
//         .writeText(text)
//         .then(() => {
//           showCopyNotification();
//         })
//         .catch(() => {
//           // Fallback pour les navigateurs plus anciens
//           fallbackCopyToClipboard(text);
//         });
//     } else {
//       fallbackCopyToClipboard(text);
//     }
//   }

//   function fallbackCopyToClipboard(text) {
//     const textArea = document.createElement("textarea");
//     textArea.value = text;
//     textArea.style.position = "fixed";
//     textArea.style.left = "-999999px";
//     textArea.style.top = "-999999px";
//     document.body.appendChild(textArea);
//     textArea.focus();
//     textArea.select();
//     try {
//       document.execCommand("copy");
//       showCopyNotification();
//     } catch (err) {
//       console.error("Erreur lors de la copie:", err);
//     }
//     textArea.remove();
//   }

//   function showCopyNotification() {
//     const notif = document.createElement("div");
//     notif.className = "csv-copy-notification";
//     notif.textContent = "Copié !";
//     inspectorPanel.appendChild(notif);
//     setTimeout(() => {
//       notif.style.opacity = "1";
//     }, 10);
//     setTimeout(() => {
//       notif.style.opacity = "0";
//       setTimeout(() => {
//         if (notif.parentNode) {
//           notif.remove();
//         }
//       }, 300);
//     }, 1000);
//   }

//   function makeDraggable(element) {
//     let pos1 = 0,
//       pos2 = 0,
//       pos3 = 0,
//       pos4 = 0;
//     element.onmousedown = (e) => {
//       e.preventDefault();
//       pos3 = e.clientX;
//       pos4 = e.clientY;
//       document.onmouseup = () => {
//         document.onmouseup = null;
//         document.onmousemove = null;
//       };
//       document.onmousemove = (e) => {
//         e.preventDefault();
//         pos1 = pos3 - e.clientX;
//         pos2 = pos4 - e.clientY;
//         pos3 = e.clientX;
//         pos4 = e.clientY;
//         inspectorPanel.style.top = inspectorPanel.offsetTop - pos2 + "px";
//         inspectorPanel.style.left = inspectorPanel.offsetLeft - pos1 + "px";
//       };
//     };
//   }

//   function deactivate() {
//     inspectorActive = false;
//     if (highlight && highlight.parentNode) {
//       highlight.remove();
//     }
//     if (inspectorPanel && inspectorPanel.parentNode) {
//       inspectorPanel.remove();
//     }
//     document.removeEventListener("mouseover", handleMouseOver, true);
//     document.removeEventListener("keydown", handleKeyDown);
//     chrome.storage.session.set({ inspectorEnabled: false });
//   }

//   // --- Utilitaires de calcul de contraste (accessibilité) ---
//   function getContrastRatio(fg, bg) {
//     const lumA = getLuminance(fg);
//     const lumB = getLuminance(bg);
//     return (Math.max(lumA, lumB) + 0.05) / (Math.min(lumA, lumB) + 0.05);
//   }

//   function getLuminance(colorStr) {
//     if (!colorStr || colorStr === "transparent") return 1;

//     const rgba = colorStr.match(/\d+/g);
//     if (!rgba) return 1;

//     const rgbaNumbers = rgba.map(Number);
//     const a = rgbaNumbers[3] !== undefined ? rgbaNumbers[3] / 255 : 1;
//     if (a < 1) return 1; // Simplification pour les fonds transparents

//     const rgb = rgbaNumbers.slice(0, 3).map((c) => {
//       c /= 255;
//       return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
//     });
//     return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
//   }

//   // Démarrer l'inspecteur
//   init();
// }
// Empêche le script de s'exécuter plusieurs fois
if (!window.cssViewerInitialized) {
  window.cssViewerInitialized = true;

  let inspectorActive = true;
  let isFrozen = false;
  let currentTarget = null;
  let highlight, inspectorPanel;
  let originalStyles = new Map(); // Stocker les styles originaux pour pouvoir les restaurer

  // --- Fonctions d'Initialisation ---
  function init() {
    createUI();
    addEventListeners();
    // Sauvegarder l'état activé
    chrome.storage.session.set({ inspectorEnabled: true });
  }

  function createUI() {
    highlight = document.createElement("div");
    highlight.id = "csv-highlight";

    inspectorPanel = document.createElement("div");
    inspectorPanel.id = "csv-inspector-panel";
    inspectorPanel.innerHTML = `
            <div class="csv-panel-header">
                <span class="csv-panel-title">CSS Viewer Pro</span>
                <div class="csv-header-controls">
                    <button class="csv-reset-btn" title="Restaurer les styles originaux">↺</button>
                    <!-- === NOUVEAU: Bouton Analyser IA === -->
                    <button class="csv-analyze-btn" title="Analyser ce CSS avec l'IA">✨ Analyser</button>
                    <span class="csv-panel-close" title="Désactiver (Echap)">&times;</span>
                </div>
            </div>
            <div class="csv-panel-content">
                <p>Survolez un élément pour l'inspecter.</p>
            </div>
            <!-- === NOUVEAU: Section pour les résultats de l'IA === -->
            <div id="csv-ai-results" class="csv-ai-results-container"></div>
        `;
    document.body.appendChild(highlight);
    document.body.appendChild(inspectorPanel);

    // Rendre le panneau interactif
    inspectorPanel.style.pointerEvents = "auto";
  }

  function addEventListeners() {
    // Utiliser capture pour s'assurer que l'événement est capturé
    document.addEventListener("mouseover", handleMouseOver, true);
    document.addEventListener("keydown", handleKeyDown);
    inspectorPanel.addEventListener("click", handlePanelClick);
    inspectorPanel.addEventListener("keydown", handleInputKeyDown);
    inspectorPanel.addEventListener("input", handleInputChange);
    inspectorPanel.addEventListener("focus", handleInputFocus, true);
    makeDraggable(inspectorPanel.querySelector(".csv-panel-header"));
  }

  // --- Gestionnaires d'Événements ---

  function handleMouseOver(e) {
    if (!inspectorActive || isFrozen) return;

    // Ignorer les éléments de l'inspecteur lui-même
    if (
      e.target.closest("#csv-inspector-panel") ||
      e.target.closest("#csv-highlight")
    ) {
      return;
    }

    currentTarget = e.target;
    updateHighlight(currentTarget);
    updatePanel(currentTarget);

    // Stocker les styles originaux si ce n'est pas déjà fait
    if (!originalStyles.has(currentTarget)) {
      storeOriginalStyles(currentTarget);
    }

    // Empêcher la propagation pour éviter les conflits
    e.stopPropagation();
  }

  function handleKeyDown(e) {
    // Appuyer sur "Maj" pour figer/dégeler l'inspecteur
    if (e.key === "Shift" && !e.target.matches("input")) {
      e.preventDefault();
      isFrozen = !isFrozen;
      highlight.style.borderColor = isFrozen ? "#FFD166" : "#448aff";

      // Mettre à jour le titre du panneau
      const title = inspectorPanel.querySelector(".csv-panel-title");
      title.textContent = isFrozen ? "CSS Viewer Pro (Figé)" : "CSS Viewer Pro";
    }
    // Appuyer sur "Echap" pour désactiver l'outil
    if (e.key === "Escape") {
      e.preventDefault();
      deactivate();
    }
  }

  function handleInputKeyDown(e) {
    if (e.target.classList.contains("csv-style-input")) {
      if (e.key === "Enter") {
        e.preventDefault();
        applyStyleChange(e.target);
      } else if (e.key === "Escape") {
        e.preventDefault();
        resetInputValue(e.target);
        e.target.blur();
      }
    }
  }

  function handleInputChange(e) {
    if (e.target.classList.contains("csv-style-input")) {
      // Appliquer les changements en temps réel pour certaines propriétés
      const property = e.target.dataset.prop;
      if (shouldApplyRealTime(property)) {
        applyStyleChange(e.target);
      }
    }
  }

  function handleInputFocus(e) {
    if (e.target.classList.contains("csv-style-input")) {
      e.target.select(); // Sélectionner tout le texte lors du focus
    }
  }

  function handlePanelClick(e) {
    // Clic sur le bouton de fermeture
    if (e.target.classList.contains("csv-panel-close")) {
      deactivate();
      return;
    }

    // === NOUVEAU: Gérer le clic sur le bouton Analyser ===
    if (e.target.classList.contains("csv-analyze-btn")) {
      if (currentTarget) {
        analyzeCurrentElementCSS();
      } else {
        alert("Veuillez d'abord figer un élément (Maj) pour l'analyser.");
      }
    }

    // Clic sur le bouton de reset
    if (e.target.classList.contains("csv-reset-btn")) {
      resetAllStyles();
      return;
    }

    // Clic sur une propriété pour la copier (seulement si ce n'est pas un input)
    if (!e.target.classList.contains("csv-style-input")) {
      const propElement = e.target.closest(".csv-style-property");
      if (propElement) {
        const propName = propElement.dataset.prop;
        const propValue =
          propElement.querySelector(".csv-style-input")?.value ||
          propElement.dataset.value;
        if (propName && propValue) {
          copyToClipboard(`${propName}: ${propValue};`);
        }
      }
    }

    // Ouvrir le sélecteur de couleur pour les propriétés de couleur
    if (e.target.classList.contains("csv-color-picker")) {
      openColorPicker(e.target);
    }
  }

  // --- NOUVELLES FONCTIONS POUR L'IA ---

  async function analyzeCurrentElementCSS() {
    const aiResultsDiv = document.getElementById("csv-ai-results");
    aiResultsDiv.innerHTML =
      '<div class="csv-loader">Analyse en cours...</div>';

    try {
      const styles = window.getComputedStyle(currentTarget);
      const properties = [
        "font-family",
        "font-size",
        "font-weight",
        "color",
        "background-color",
        "width",
        "height",
        "padding",
        "margin",
        "border",
        "display",
        "position",
      ];

      // Formater le CSS pour l'envoyer à l'API
      const cssCode = properties
        .map((prop) => `  ${prop}: ${styles.getPropertyValue(prop)};`)
        .join("\n");
      const selector = generateUniqueSelector(currentTarget);
      const fullCss = `${selector} {\n${cssCode}\n}`;

      // Appeler notre backend
      const response = await fetch("http://localhost:3001/api/analyze-css", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cssCode: fullCss }),
      });

      if (!response.ok) {
        throw new Error(`Erreur du serveur: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        displayAiSuggestions(result.data);
      } else {
        throw new Error(result.message || "L'analyse a échoué.");
      }
    } catch (error) {
      console.error("Erreur d'analyse IA:", error);
      aiResultsDiv.innerHTML = `<div class="csv-error">Erreur: ${error.message}</div>`;
    }
  }

  function displayAiSuggestions(suggestions) {
    const aiResultsDiv = document.getElementById("csv-ai-results");
    aiResultsDiv.innerHTML = `
        <div class="csv-ai-suggestion">
            <h4>♿ Accessibilité</h4>
            <p>${escapeHTML(suggestions.accessibility)}</p>
        </div>
        <div class="csv-ai-suggestion">
            <h4>⚡ Performance</h4>
            <p>${escapeHTML(suggestions.performance)}</p>
        </div>
        <div class="csv-ai-suggestion">
            <h4>🚀 Modernisation</h4>
            <p>${escapeHTML(suggestions.modernization)}</p>
        </div>
    `;
  }

  // Fonction utilitaire
  function generateUniqueSelector(element) {
    if (element.id) return `#${element.id}`;
    if (element.className && typeof element.className === "string") {
      return `.${element.className.trim().replace(/\s+/g, ".")}`;
    }
    return element.tagName.toLowerCase();
  }

  function escapeHTML(str) {
    const p = document.createElement("p");
    p.textContent = str;
    return p.innerHTML;
  }

  // --- Fonctions de Gestion des Styles ---

  function storeOriginalStyles(element) {
    const computedStyles = window.getComputedStyle(element);
    const originalStylesObj = {};

    // Stocker toutes les propriétés CSS importantes
    const importantProperties = [
      "color",
      "background-color",
      "font-size",
      "font-family",
      "font-weight",
      "margin",
      "padding",
      "border",
      "width",
      "height",
      "display",
      "position",
      "top",
      "left",
      "right",
      "bottom",
      "z-index",
      "opacity",
      "transform",
    ];

    importantProperties.forEach((prop) => {
      originalStylesObj[prop] = computedStyles.getPropertyValue(prop);
    });

    originalStyles.set(element, originalStylesObj);
  }

  function applyStyleChange(input) {
    if (!currentTarget) return;

    const property = input.dataset.prop;
    const value = input.value.trim();
    const jsProperty = convertCSSPropertyToJS(property);

    try {
      // Appliquer le style
      currentTarget.style[jsProperty] = value;

      // Mettre à jour la couleur de l'input pour indiquer que le changement a été appliqué
      input.style.backgroundColor = "#e8f5e8";
      setTimeout(() => {
        input.style.backgroundColor = "";
      }, 300);

      // Mettre à jour l'attribut data-value
      input.closest(".csv-style-property").dataset.value = value;
    } catch (error) {
      console.warn("Erreur lors de l'application du style:", error);
      // Mettre à jour la couleur de l'input pour indiquer une erreur
      input.style.backgroundColor = "#ffe8e8";
      setTimeout(() => {
        input.style.backgroundColor = "";
      }, 1000);
    }
  }

  function resetInputValue(input) {
    const property = input.dataset.prop;
    const originalValue = input.dataset.originalValue;
    input.value = originalValue;
  }

  function resetAllStyles() {
    if (!currentTarget || !originalStyles.has(currentTarget)) return;

    const original = originalStyles.get(currentTarget);

    // Restaurer tous les styles originaux
    Object.keys(original).forEach((prop) => {
      const jsProperty = convertCSSPropertyToJS(prop);
      currentTarget.style[jsProperty] = "";
    });

    // Mettre à jour le panneau pour refléter les styles restaurés
    updatePanel(currentTarget);

    // Afficher une notification
    showNotification("Styles restaurés");
  }

  function convertCSSPropertyToJS(cssProperty) {
    return cssProperty.replace(/-([a-z])/g, (match, letter) =>
      letter.toUpperCase()
    );
  }

  function shouldApplyRealTime(property) {
    // Propriétés qui peuvent être appliquées en temps réel sans problème
    const realTimeProperties = [
      "color",
      "background-color",
      "opacity",
      "transform",
    ];
    return realTimeProperties.includes(property);
  }

  function isColorProperty(property) {
    return property.includes("color") || property === "border-color";
  }

  // --- Fonctions de Mise à Jour de l'UI ---

  function updateHighlight(element) {
    const rect = element.getBoundingClientRect();
    highlight.style.display = "block";
    highlight.style.width = `${rect.width}px`;
    highlight.style.height = `${rect.height}px`;
    highlight.style.top = `${rect.top + window.scrollY}px`;
    highlight.style.left = `${rect.left + window.scrollX}px`;
  }

  function updatePanel(element) {
    const styles = window.getComputedStyle(element);
    const contentDiv = inspectorPanel.querySelector(".csv-panel-content");

    // Obtenir des informations sur l'élément
    const elementInfo = getElementInfo(element);
    const fontStyles = getStylesGroup(styles, [
      "font-family",
      "font-size",
      "font-weight",
      "font-style",
      "line-height",
      "color",
      "text-align",
    ]);
    const boxModelStyles = getBoxModelStyles(styles);
    const layoutStyles = getStylesGroup(styles, [
      "display",
      "position",
      "z-index",
      "top",
      "left",
      "right",
      "bottom",
      "float",
      "clear",
    ]);
    const backgroundStyles = getStylesGroup(styles, [
      "background-color",
      "background-image",
      "background-size",
      "background-position",
    ]);

    contentDiv.innerHTML = `
            ${createElementInfoHTML(elementInfo)}
            ${createGroupHTML("Typographie", fontStyles, true)}
            ${createGroupHTML("Modèle de Boîte", boxModelStyles, true)}
            ${createGroupHTML("Positionnement", layoutStyles, true)}
            ${createGroupHTML("Arrière-plan", backgroundStyles, true)}
        `;
  }

  // --- Fonctions Utilitaires ---

  function getElementInfo(element) {
    const info = [];
    info.push({ prop: "Tag", value: element.tagName.toLowerCase() });

    if (element.id) {
      info.push({ prop: "ID", value: `#${element.id}` });
    }

    if (element.className) {
      const classes = element.className
        .split(" ")
        .filter((c) => c.trim())
        .join(" ");
      if (classes) {
        info.push({
          prop: "Classes",
          value: `.${classes.split(" ").join(" .")}`,
        });
      }
    }

    return info;
  }

  function getStylesGroup(styles, properties) {
    const result = [];
    for (const prop of properties) {
      const value = styles.getPropertyValue(prop);
      if (
        value &&
        value !== "none" &&
        value !== "0px" &&
        value !== "auto" &&
        value !== "normal"
      ) {
        result.push({ prop, value });
      }
    }
    return result;
  }

  function getBoxModelStyles(styles) {
    const result = [];
    const dimensions = ["width", "height"];
    const spacing = ["margin", "padding"];
    const border = ["border-width", "border-style", "border-color"];

    // Dimensions
    for (const prop of dimensions) {
      const value = styles.getPropertyValue(prop);
      if (value && value !== "auto" && value !== "0px") {
        result.push({ prop, value });
      }
    }

    // Espacement
    for (const prop of spacing) {
      const value = styles.getPropertyValue(prop);
      if (value && value !== "0px") {
        result.push({ prop, value });
      }
    }

    // Bordures
    for (const prop of border) {
      const value = styles.getPropertyValue(prop);
      if (value && value !== "none" && value !== "0px") {
        result.push({ prop, value });
      }
    }

    return result;
  }

  function createElementInfoHTML(data) {
    const propertiesHTML = data
      .map(
        (item) => `
            <div class="csv-element-info">
                <span class="csv-prop-name">${item.prop}</span>
                <span class="csv-prop-value">${item.value}</span>
            </div>
        `
      )
      .join("");
    return `
            <div class="csv-element-section">
                <h3>Élément</h3>
                ${propertiesHTML}
            </div>
        `;
  }

  function createGroupHTML(title, data, editable = false) {
    if (data.length === 0) return "";

    const propertiesHTML = data
      .map((item) => {
        if (editable) {
          const isColor = isColorProperty(item.prop);
          const colorPickerHTML = isColor
            ? `<button class="csv-color-picker" title="Sélecteur de couleur">🎨</button>`
            : "";

          return `
                <div class="csv-style-property" data-prop="${item.prop}" data-value="${item.value}">
                    <span class="csv-prop-name">${item.prop}</span>
                    <div class="csv-prop-value-container">
                        <input type="text" class="csv-style-input" 
                               data-prop="${item.prop}" 
                               data-original-value="${item.value}"
                               value="${item.value}"
                               title="Appuyez sur Entrée pour appliquer, Échap pour annuler">
                        ${colorPickerHTML}
                    </div>
                </div>
            `;
        } else {
          return `
                <div class="csv-style-property" data-prop="${item.prop}" data-value="${item.value}">
                    <span class="csv-prop-name">${item.prop}</span>
                    <span class="csv-prop-value">${item.value}</span>
                </div>
            `;
        }
      })
      .join("");

    return `
            <div class="csv-style-group">
                <h3>${title}</h3>
                ${propertiesHTML}
            </div>
        `;
  }

  function openColorPicker(button) {
    const input = button.previousElementSibling;
    const property = input.dataset.prop;

    // Créer un input de type color temporaire
    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.style.position = "absolute";
    colorInput.style.opacity = "0";
    colorInput.style.pointerEvents = "none";

    // Convertir la valeur actuelle en format hex si possible
    const currentValue = input.value;
    const hexColor = convertToHex(currentValue);
    if (hexColor) {
      colorInput.value = hexColor;
    }

    document.body.appendChild(colorInput);

    colorInput.onchange = function () {
      input.value = colorInput.value;
      applyStyleChange(input);
      document.body.removeChild(colorInput);
    };

    colorInput.click();
  }

  function convertToHex(colorStr) {
    // Fonction simple pour convertir rgb() en hex
    const rgbMatch = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]);
      const g = parseInt(rgbMatch[2]);
      const b = parseInt(rgbMatch[3]);
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    // Si c'est déjà au format hex, le retourner
    if (colorStr.startsWith("#")) {
      return colorStr;
    }

    // Couleurs nommées courantes
    const namedColors = {
      red: "#FF0000",
      green: "#008000",
      blue: "#0000FF",
      black: "#000000",
      white: "#FFFFFF",
      gray: "#808080",
      grey: "#808080",
      yellow: "#FFFF00",
      orange: "#FFA500",
      purple: "#800080",
      pink: "#FFC0CB",
      brown: "#A52A2A",
    };

    return namedColors[colorStr.toLowerCase()] || null;
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          showNotification("Copié !");
        })
        .catch(() => {
          // Fallback pour les navigateurs plus anciens
          fallbackCopyToClipboard(text);
        });
    } else {
      fallbackCopyToClipboard(text);
    }
  }

  function fallbackCopyToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      showNotification("Copié !");
    } catch (err) {
      console.error("Erreur lors de la copie:", err);
    }
    textArea.remove();
  }

  function showNotification(message) {
    const notif = document.createElement("div");
    notif.className = "csv-copy-notification";
    notif.textContent = message;
    inspectorPanel.appendChild(notif);
    setTimeout(() => {
      notif.style.opacity = "1";
    }, 10);
    setTimeout(() => {
      notif.style.opacity = "0";
      setTimeout(() => {
        if (notif.parentNode) {
          notif.remove();
        }
      }, 300);
    }, 1000);
  }

  function makeDraggable(element) {
    let pos1 = 0,
      pos2 = 0,
      pos3 = 0,
      pos4 = 0;
    element.onmousedown = (e) => {
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = () => {
        document.onmouseup = null;
        document.onmousemove = null;
      };
      document.onmousemove = (e) => {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        inspectorPanel.style.top = inspectorPanel.offsetTop - pos2 + "px";
        inspectorPanel.style.left = inspectorPanel.offsetLeft - pos1 + "px";
      };
    };
  }

  function deactivate() {
    inspectorActive = false;

    // Fermer la modale d'export si elle est ouverte
    const modal = document.getElementById("csv-export-modal");
    if (modal && modal.parentNode) {
      modal.remove();
    }

    if (highlight && highlight.parentNode) {
      highlight.remove();
    }
    if (inspectorPanel && inspectorPanel.parentNode) {
      inspectorPanel.remove();
    }
    document.removeEventListener("mouseover", handleMouseOver, true);
    document.removeEventListener("keydown", handleKeyDown);
    chrome.storage.session.set({ inspectorEnabled: false });
  }

  // --- Utilitaires de calcul de contraste (accessibilité) ---
  function getContrastRatio(fg, bg) {
    const lumA = getLuminance(fg);
    const lumB = getLuminance(bg);
    return (Math.max(lumA, lumB) + 0.05) / (Math.min(lumA, lumB) + 0.05);
  }

  function getLuminance(colorStr) {
    if (!colorStr || colorStr === "transparent") return 1;

    const rgba = colorStr.match(/\d+/g);
    if (!rgba) return 1;

    const rgbaNumbers = rgba.map(Number);
    const a = rgbaNumbers[3] !== undefined ? rgbaNumbers[3] / 255 : 1;
    if (a < 1) return 1; // Simplification pour les fonds transparents

    const rgb = rgbaNumbers.slice(0, 3).map((c) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }

  // Démarrer l'inspecteur
  init();
}
