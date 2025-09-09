// Empêche le script de s'exécuter plusieurs fois
if (!window.cssViewerInitialized) {
  window.cssViewerInitialized = true;

  let inspectorActive = true;
  let isFrozen = false;
  let currentTarget = null;
  let highlight, inspectorPanel;

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
                <span class="csv-panel-close" title="Désactiver (Echap)">&times;</span>
            </div>
            <div class="csv-panel-content">
                <p>Survolez un élément pour l'inspecter.</p>
            </div>
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

    // Empêcher la propagation pour éviter les conflits
    e.stopPropagation();
  }

  function handleKeyDown(e) {
    // Appuyer sur "Maj" pour figer/dégeler l'inspecteur
    if (e.key === "Shift") {
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

  function handlePanelClick(e) {
    // Clic sur le bouton de fermeture
    if (e.target.classList.contains("csv-panel-close")) {
      deactivate();
      return;
    }

    // Clic sur une propriété pour la copier
    const propElement = e.target.closest(".csv-style-property");
    if (propElement) {
      const propName = propElement.dataset.prop;
      const propValue = propElement.dataset.value;
      if (propName && propValue) {
        copyToClipboard(`${propName}: ${propValue};`);
      }
    }
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
            ${createGroupHTML("Typographie", fontStyles)}
            ${createGroupHTML("Modèle de Boîte", boxModelStyles)}
            ${createGroupHTML("Positionnement", layoutStyles)}
            ${createGroupHTML("Arrière-plan", backgroundStyles)}
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

  function createGroupHTML(title, data) {
    if (data.length === 0) return "";

    const propertiesHTML = data
      .map(
        (item) => `
            <div class="csv-style-property" data-prop="${item.prop}" data-value="${item.value}">
                <span class="csv-prop-name">${item.prop}</span>
                <span class="csv-prop-value">${item.value}</span>
            </div>
        `
      )
      .join("");
    return `
            <div class="csv-style-group">
                <h3>${title}</h3>
                ${propertiesHTML}
            </div>
        `;
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          showCopyNotification();
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
      showCopyNotification();
    } catch (err) {
      console.error("Erreur lors de la copie:", err);
    }
    textArea.remove();
  }

  function showCopyNotification() {
    const notif = document.createElement("div");
    notif.className = "csv-copy-notification";
    notif.textContent = "Copié !";
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
