// Écoute les messages venant du popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleInspector") {
    toggleInspectorOnActiveTab(request.enabled);
  }
});

// Gère la navigation : si l'inspection est active, on l'injecte dans les nouvelles pages
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url.startsWith("http")) {
    const { inspectorEnabled } = await chrome.storage.session.get(
      "inspectorEnabled"
    );
    if (inspectorEnabled) {
      injectScripts(tabId);
    }
  }
});

// Fonction pour injecter/désactiver l'inspecteur
async function toggleInspectorOnActiveTab(isEnabled) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url.startsWith("http")) {
    if (isEnabled) {
      await injectScripts(tab.id);
    } else {
      // Pour désactiver, on recharge simplement la page pour la nettoyer
      await chrome.tabs.reload(tab.id);
    }
  }
}

// Fonction pour injecter les scripts et le CSS
async function injectScripts(tabId) {
  try {
    await chrome.scripting.insertCSS({
      target: { tabId: tabId },
      files: ["inspector.css"],
    });
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["contentScript.js"],
    });
  } catch (err) {
    console.error("Échec de l'injection des scripts:", err);
  }
}
