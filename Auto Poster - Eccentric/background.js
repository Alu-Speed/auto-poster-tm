chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action !== "openTabAndSend") {
    return;
  }

  (async () => {
    try {
      const targetUrl = msg.targetUrl; // ex. ".../newreply.php?tid=12345"
      // 1) GET pour récupérer le HTML et en extraire my_post_key
      const getRes = await fetch(targetUrl, {
        method: "GET",
        credentials: "include"
      });
      const html = await getRes.text();

      // 2) Extraction du token via regex
      const match = html.match(
        /<input[^>]+name=["']my_post_key["'][^>]+value=["']([^"']+)["']/i
      );
      if (!match) {
        throw new Error("Token my_post_key introuvable");
      }
      const myPostKey = match[1];

      // 3) Construction du payload
      const form = new URLSearchParams();
      form.append("message", msg.message);
      form.append("my_post_key", myPostKey);
      form.append("action", "do_newreply");
      form.append("postoptions[signature]", "1");

      // 4) POST du formulaire
      const postRes = await fetch(targetUrl, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        },
        body: form.toString()
      });

      if (!postRes.ok) {
        throw new Error(`Échec HTTP ${postRes.status}`);
      }

      sendResponse({ success: true });
    } catch (error) {
      console.error("Envoi échoué :", error);
      sendResponse({ success: false, error: error.message });
    }
  })();

  // Pour indiquer qu'on répondra de façon asynchrone
  return true;
});
