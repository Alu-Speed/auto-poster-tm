// Il faut dire que lorsque j'ai créé cette extension, que je l'ai codée, je savais ce que je faisais.
// Maintenant, seul Dieu sait comment elle fonctionne...
// Rule #1: If it works, don't touch it.

// Filtrage d'URL : ne s'exécute que sur les pages ciblées
(function () {
    const currentUrl = window.location.href;
    let assuranceTid = localStorage.getItem("assuranceTid") || null;

    const isBreakdownPage = currentUrl.startsWith("https://transport-manager.net/jeu/breakdown.php");
    const isForumThreadPage = assuranceTid && currentUrl.match(new RegExp(`thread-${assuranceTid}(-page-\\d+)?\\.html`));

    if (!isBreakdownPage && !isForumThreadPage) {
        console.log("Auto Poster : page non ciblée, script ignoré.");
        return;
    }

    // Ton script principal commence ici ↓↓↓
    
    const forumReplyUrlBase = "https://forum.transport-manager.net/newreply.php?tid=";
    const breakdownUrl = "https://transport-manager.net/jeu/breakdown.php";

    
    afficherMessageDeBienvenue();

    // Bienvenue !
    function afficherMessageDeBienvenue() {
        const premierDemarrage = !localStorage.getItem("assuranceTid") || !localStorage.getItem("contratType");

        if (premierDemarrage) {
            alert("Bienvenue dans l'extension Auto Poster ! \nPour que l'extension fonctionne complètement, nous avons besoin de quelques informations :");
            demanderAssurance(); // Appelle la fonction pour demander le contrat
            demanderContratType(); // Appelle la fonction pour demander le type de contrat
            alert("Merci ! Votre extension est maintenant configurée.");
        } else {
            console.log("L'extension Auto Poster est déjà configurée.");
        }
    }

    // Demander le lien ou le numéro du contrat d'assurance au premier lancement
    function demanderAssurance() {
        if (!assuranceTid) {
            const assuranceInput = prompt("Veuillez entrer le lien ou le numéro de votre contrat d'assurance (ex. https://forum.transport-manager.net/thread-XXXXX.html ou juste XXXXX) :");
            if (assuranceInput) {
                const tidMatch = assuranceInput.match(/tid=(\d+)|thread-(\d+)/);
                assuranceTid = tidMatch ? tidMatch[1] || tidMatch[2] : assuranceInput;
                if (assuranceTid) {
                    localStorage.setItem("assuranceTid", assuranceTid);
                } else {
                    alert("Numéro de contrat d'assurance non valide !");
                }
            }
        }
    }

    // Fonction pour demander le type de contrat
    function demanderContratType() {
        let contratType = localStorage.getItem("contratType") || null;

        if (!contratType) {
            const choixContrat = prompt("Veuillez sélectionner le type de contrat :\n1. Tous Risques\n2. Extension de Garantie");
            if (choixContrat === "1") {
                contratType = "Tous Risques";
            } else if (choixContrat === "2") {
                contratType = "Extension de Garantie";
            } else {
                alert("Type de contrat invalide, veuillez relancer l'extension.");
                return;
            }
            localStorage.setItem("contratType", contratType);
        }
        return contratType;
    }

    // Appeler les fonctions pour initialiser les données
    demanderAssurance();
    const contratType = demanderContratType();

    const forumReplyUrl = `${forumReplyUrlBase}${assuranceTid}`;

    function insertForm() {
        let container = document.createElement("div");
        container.style = "position:fixed; bottom:10px; right:10px; background:#fff; padding:15px; border:1px solid #ccc; border-radius:8px; box-shadow: 2px 2px 10px rgba(0,0,0,0.2); max-width: 300px;";
        container.innerHTML = `
            <h4 style="margin:0 0 10px 0; font-size:16px;">Auto Poster</h4>
            <div id="pannesContainer">
                ${createPanneForm()}
            </div>
            <button id="addPanne" style="margin-top:10px; display:block; width:100%;">+ Ajouter panne</button>
            <button id="sendMessage" style="margin-top:10px; background:#28a745; color:#fff; border:none; padding:8px; width:100%; border-radius:4px; cursor:pointer;">Envoyer</button>
        `;
        document.body.appendChild(container);
        document.getElementById("addPanne").addEventListener("click", addPanne);
        document.getElementById("sendMessage").addEventListener("click", sendMessage);
    }

function createMarqueDropdown() {
    const groupedMarques = {
        "EVOBUS": ["Mercedes-Benz", "Setra"],
        "HVB": ["Heuliez", "Volvo", "Bluebus"],
        "Iveco": ["Iveco"],
        "MVMate": ["Man", "Neoplan", "Scania"],
        "Solaris": ["Solaris"],
        "VDI": ["Irizar", "Hess", "VDL", "VanHool"]
    };

    let select = '<select class="marque">';
    for (const [concession, marques] of Object.entries(groupedMarques)) {
        select += `<optgroup label="${concession}">`;
        marques.forEach(marque => {
            select += `<option value="${marque}">${marque}</option>`;
        });
        select += '</optgroup>';
    }
    select += '</select>';
    return select;
}

function createPanneForm() {
    return `
        <div class="panne" style="border-top:1px solid #ccc; margin-top:10px; padding-top:10px;">
            <label>Plaque: <input type="text" class="plaque"></label><br>
            <label>Panne: <input type="text" class="panneType" placeholder="Panne à signaler" onfocus="this.placeholder=''" onblur="this.placeholder='Panne à signaler'"></label><br>
            <label>Marque: ${createMarqueDropdown()}</label><br>
            <label>Prêt: <select class="pret"><option>Non</option><option>Oui</option></select></label><br>
            <button class="removePanne" style="margin-top:10px; background:#dc3545; color:#fff; border:none; padding:5px; border-radius:4px; cursor:pointer;">Retirer</button>
        </div>
    `;
}

function addPanne() {
    const pannesContainer = document.getElementById("pannesContainer");
    // Ajouter un nouvel élément de panne à la fin sans effacer le contenu existant
    const newPanne = document.createElement("div");
    newPanne.innerHTML = createPanneForm();
    pannesContainer.appendChild(newPanne);

    // Ajouter les événements au bouton "Retirer" de la nouvelle panne
    newPanne.querySelector(".removePanne").addEventListener("click", removePanne);
}

function removePanne(event) {
    event.target.closest(".panne").remove();
}

// Vérif. prise en charge Concess

function normalizeString(str) {
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function validatePanneType(type) {
    const panneListe = [
        "alternateur hs", "boite de vitesse hs", "batterie de traction hs",
        "capteur de securite de reservoir hs", "cassure moteur",
        "cassure moteur electrique", "convertisseur hs", "courroie hs",
        "defaillance de l'onduleur", "defaillance du detendeur", "defaut portes",
        "demarreur hs", "hausse importante de la temperature",
        "panne du systeme de freinage regeneratif", "pompe d'alimentation hs",
        "probleme d'injection de gaz", "probleme de suspensions",
        "reducteur a rapport hs", "solenoide hs", "turbo hs",
        "usure anormale des bougies", "ventilateur moteur hs"
    ];
    return panneListe.includes(normalizeString(type));
}

function getConcessionUrl(marque) {
    const concessions = {
        "Mercedes-Benz": "https://concess.transport-manager.net/evobus",
        "Setra": "https://concess.transport-manager.net/evobus",
        "Heuliez": "https://concess.transport-manager.net/hvb",
        "Volvo": "https://concess.transport-manager.net/hvb",
        "Bluebus": "https://https://concess.transport-manager.net/hvb",
        "Iveco": "https://concess.transport-manager.net/iveco",
        "Man": "https://concess.transport-manager.net/mvmate",
        "Neoplan": "https://concess.transport-manager.net/mvmate",
        "Scania": "https://concess.transport-manager.net/mvmate",
        "Solaris": "https://concess.transport-manager.net/solaris",
        "Irizar": "https://concess.transport-manager.net/vdi",
        "Hess": "https://concess.transport-manager.net/vdi",
        "VDL": "https://concess.transport-manager.net/vdi",
        "VanHool": "https://concess.transport-manager.net/vdi"
    };
    return concessions[marque] || null;
}



// Vérif. prise en charge Assurance et SEND f(x) //


// Fonction pour charger dynamiquement le fichier pannes.json
function loadPannesData(callback) {
    fetch(chrome.runtime.getURL("pannes.json"))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur de chargement du fichier JSON : ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Données de pannes chargées :", data);
            callback(data); // Passe les données au callback
        })
        .catch(error => {
            console.error("Erreur lors du chargement des données de pannes :", error);
        });
}

// Charger les données et appeler les fonctions principales après
loadPannesData((panneData) => {
    console.log("Données disponibles :", panneData);

    // Vérifiez que les données sont valides
    if (!panneData || Object.keys(panneData).length === 0) {
        console.error("Erreur critique : Les données de pannes sont invalides ou vides !");
        return;
    }

    // Fonction pour vérifier si une panne est prise en charge par le contrat
    function isPannePriseEnCharge(panneType, contratType, panneData) {
        const panneInfo = panneData[panneType];
        if (!panneInfo) {
            console.warn(`[WARNING] Panne "${panneType}" non trouvée dans la liste.`);
            return false; // La panne n'est pas répertoriée
        }
        return panneInfo[contratType] || false; // Retourne false si non défini
    }

    // Fonction principale pour envoyer un message
    function sendMessage() {
    const pannes = document.querySelectorAll(".panne");
    if (pannes.length === 0) {
        alert("Aucune panne détectée. Veuillez en ajouter avant d'envoyer.");
        return;
    }

    let messageIntro = "Bonjour LG,\n\n";
    messageIntro += "Je te contacte concernant les véhicules en panne couverts par notre contrat d'assurance. Tu trouveras ci-dessous les détails des incidents rencontrés aujourd'hui 😊\n\n";

    let messagePannes = "[quote]\n";
    let anyValid = false;

    pannes.forEach(panne => {
        const plaque = panne.querySelector(".plaque").value;
        const panneType = panne.querySelector(".panneType").value;
        const pret = panne.querySelector(".pret").value;
        const marque = panne.querySelector(".marque").value;

        messagePannes += `[b][size=medium][color=#003366]• Immatriculation véhicule :[/color][/size][/b] [img=100x22]https://transport-manager.net/assets/immat/plaque.php?id=${plaque}[/img]\n`;
        messagePannes += `[b]• Problème rencontré :[/b] ${panneType}\n`;
        messagePannes += `[b]• Marque du véhicule :[/b] ${marque}\n`;
        messagePannes += `[b]• Véhicule de prêt souhaité :[/b] ${pret}\n`;
        messagePannes += `[color=gray]-------------------------------------[/color]\n`;

        anyValid = true;
    });

    messagePannes += "[/quote]\n";

    if (!anyValid) {
        alert("Plus aucun véhicule à envoyer à l'assurance.");
        return;
    }

    let messageOutro = "\nMerci d'avance pour ton aide !\n\n";
    messageOutro += "[i]Ce message a été envoyé grâce à l'extension Auto Poster (Eccentric) v.0.3.9[/i]\n";
    messageOutro += "[i]Version de développement avancée. Utilisation publique autorisée.[/i]";
	// Cette version est privée et en cours de développement. Elle peut comporter des bugs et ne doit pas être diffusée publiquement.

    const finalMessage = messageIntro + messagePannes + messageOutro;

    sendFormInBackground(finalMessage);
}

    // Fonction pour envoyer en arrière-plan
    function sendFormInBackground(message) {
    const targetUrl = forumReplyUrl;

    // Envoyer un message au fichier d'arrière-plan pour créer l'onglet
    chrome.runtime.sendMessage(
        {
            action: "openTabAndSend",
            targetUrl: targetUrl,
            message: message
        },
        (response) => {
            if (response && response.success) {
                console.log("Message envoyé avec succès via l'onglet en arrière-plan !");
                alert("Message envoyé avec succès !");
            } else {
                console.error("Erreur lors de l'envoi du message via l'onglet :", response.error);
                alert("Erreur lors de l'envoi du message !");
            }
        }
    );
}


    // Fonction injectée pour déclencher sendMessage
    document.getElementById("sendMessage").addEventListener("click", () => sendMessage());
});

insertForm();
    
})();
