document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("inspector-toggle");

  // Au chargement, vérifier l'état sauvegardé et mettre à jour le switch
  chrome.storage.session.get(["inspectorEnabled"], (result) => {
    toggle.checked = !!result.inspectorEnabled;
  });

  // Quand l'utilisateur clique sur le switch
  toggle.addEventListener("change", async () => {
    const isEnabled = toggle.checked;

    // Sauvegarder le nouvel état
    await chrome.storage.session.set({ inspectorEnabled: isEnabled });

    // Envoyer un message au service worker pour qu'il agisse
    chrome.runtime.sendMessage({
      action: "toggleInspector",
      enabled: isEnabled,
    });
  });
});
