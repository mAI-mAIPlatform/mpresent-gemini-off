// Ce fichier contient toute la logique JavaScript, préparée pour l'écosystème Vite.

document.addEventListener('DOMContentLoaded', () => {
    // Éléments pour la Recommandation de Modèle (Feature 1)
    const exploreButton = document.getElementById('exploreButton');
    const taskInput = document.getElementById('taskInput');
    const modelSelect = document.getElementById('modelSelect');
    const resultsContainer = document.getElementById('resultsContainer');
    const modelRecommendation = document.getElementById('modelRecommendation');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const buttonText = document.getElementById('buttonText');
    const errorBox = document.getElementById('errorBox');

    // Nouveaux éléments pour le Générateur de Témoignages (Feature 2)
    const rawFeedbackInput = document.getElementById('rawFeedbackInput');
    const personaSelect = document.getElementById('personaSelect');
    const generateTestimonialButton = document.getElementById('generateTestimonialButton');
    const genResultsContainer = document.getElementById('genResultsContainer');
    const generatedTestimonial = document.getElementById('generatedTestimonial');
    const genLoadingIndicator = document.getElementById('genLoadingIndicator');
    const genButtonText = document.getElementById('genButtonText');
    const genErrorBox = document.getElementById('genErrorBox');

    // --- Configuration et Fonctions API Gemini ---
    // NOTE: Pour une vraie application Vite/Vercel, l'API_KEY serait stockée dans
    // des variables d'environnement (ex: import.meta.env.VITE_GEMINI_API_KEY).
    const API_KEY = ""; 
    const MODEL_NAME = 'gemini-2.5-flash-preview-05-20';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;
    
    // Descriptions des modèles mAI utilisées pour guider l'IA (Feature 1)
    const modelDescriptions = {
        'm-4.0': 'Le modèle généraliste pour des tâches quotidiennes simples et rapides (Quotidien).',
        'm-4.3-mini': 'Le modèle le plus léger, écologique et rapide pour des requêtes courtes et efficaces (Écologique).',
        'm-4.5 Pro': 'Le modèle professionnel, expert en précision, analyse de données complexes et raisonnements logiques (Professionnel).',
        'm-4.7o': 'Le modèle polyvalent, précis et capable de gérer de longues conversations et du contenu créatif (Précis).',
        'm-4.9+': 'Le fleuron, le plus rapide et le plus performant pour un résultat optimal sur tout type de tâche courte (Rapide).',
    };

    // Fonction utilitaire pour l'attente avec délai
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Fonction pour l'appel API avec Backoff Exponentiel (réutilisée pour les deux features)
    async function fetchWithExponentialBackoff(payload, maxRetries = 5) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    return await response.json();
                } else if (response.status === 429 && i < maxRetries - 1) {
                    // Trop de requêtes (Too Many Requests) - Rétry
                    const delay = Math.pow(2, i) * 1000 + Math.random() * 500;
                    await sleep(delay);
                } else {
                    throw new Error(`API call failed with status: ${response.status}`);
                }
            } catch (error) {
                if (i === maxRetries - 1) {
                    console.error("Gemini API request failed after all retries.", error);
                    throw error;
                }
                const delay = Math.pow(2, i) * 1000 + Math.random() * 500;
                await sleep(delay);
            }
        }
    }
    
    // --- Logique de Recommandation de Modèle (Feature 1) ---
    exploreButton.addEventListener('click', async () => {
        const userTask = taskInput.value.trim();
        
        // Réinitialisation de l'état
        errorBox.classList.add('hidden');
        modelRecommendation.innerHTML = 'Analyse en cours...';
        resultsContainer.classList.remove('hidden');

        if (userTask.length < 5) {
            modelRecommendation.innerHTML = 'Veuillez entrer une description de tâche plus détaillée (minimum 5 caractères).';
            return;
        }

        // Affichage de l'état de chargement
        exploreButton.disabled = true;
        loadingIndicator.classList.remove('hidden');
        buttonText.textContent = 'Analyse...';

        try {
            // Création de l'instruction système
            const systemPrompt = `
                Vous êtes un expert en produits d'IA pour mAI. 
                Votre tâche est de justifier lequel des 5 modèles mAI est le meilleur choix pour la tâche demandée par l'utilisateur. 
                Utilisez uniquement les descriptions de modèles fournies ci-dessous. 
                Vous devez fournir un paragraphe concis, enthousiaste et professionnel, en mettant en évidence le modèle recommandé (par exemple, "m-4.5 Pro") en gras.
                Basez votre réponse sur la tâche de l'utilisateur et les capacités des modèles.
                Ne mentionnez pas que les modèles sont fictifs, que vous êtes une IA, ou que vous n'avez pas accès à des données externes. 
                N'utilisez PAS d'outil de recherche.
            `;

            // Création de la requête utilisateur
            const userQuery = `
                Basé sur les descriptions suivantes, quel modèle mAI est le meilleur pour la tâche : "${userTask}"?
                
                Descriptions des Modèles mAI:
                ${Object.entries(modelDescriptions).map(([name, desc]) => `- ${name}: ${desc}`).join('\n')}
            `;

            const payload = {
                contents: [{ parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
            };

            const result = await fetchWithExponentialBackoff(payload);
            const generatedText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (generatedText) {
                modelRecommendation.innerHTML = generatedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            } else {
                throw new Error("Réponse de l'IA vide ou inattendue.");
            }

        } catch (error) {
            console.error("Erreur dans la recommandation de modèle:", error);
            errorBox.classList.remove('hidden');
            modelRecommendation.innerHTML = 'Impossible de générer la recommandation pour le moment.';
        } finally {
            // Masquage de l'état de chargement
            exploreButton.disabled = false;
            buttonText.textContent = 'Recommander le Modèle'; 
            loadingIndicator.classList.add('hidden');
        }
    });

    // --- Logique de Génération de Témoignage (Feature 2) ---
    generateTestimonialButton.addEventListener('click', async () => {
        const rawFeedback = rawFeedbackInput.value.trim();
        const persona = personaSelect.value;
        
        // Reset state
        genErrorBox.classList.add('hidden');
        generatedTestimonial.innerHTML = 'Génération en cours...';
        genResultsContainer.classList.remove('hidden');

        if (rawFeedback.length < 10) {
            generatedTestimonial.innerHTML = 'Veuillez entrer un feedback plus substantiel (minimum 10 caractères).';
            return;
        }

        // Show loading state
        generateTestimonialButton.disabled = true;
        genLoadingIndicator.classList.remove('hidden');
        genButtonText.textContent = 'Génération...';

        try {
            const systemPrompt = `
                Vous êtes un rédacteur de contenu professionnel spécialisé en témoignages clients pour des produits d'IA B2B. 
                Transformez le feedback brut de l'utilisateur en un témoignage client convaincant. 
                Le témoignage doit être au format d'une citation unique, crédible, enthousiaste, et refléter la perspective du rôle professionnel suivant: "${persona}". 
                Le témoignage doit avoir entre 2 et 4 phrases, utiliser un langage professionnel, et se concentrer sur l'impact commercial ou technique (selon la persona). 
                N'ajoutez pas le nom de la personne. Ne parlez pas en tant qu'IA.
            `;

            const userQuery = `Feedback brut à transformer : "${rawFeedback}"`;

            const payload = {
                contents: [{ parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
            };

            const result = await fetchWithExponentialBackoff(payload);
            const generatedText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (generatedText) {
                // Ajout des guillemets français autour du témoignage
                generatedTestimonial.innerHTML = `&ldquo;${generatedText.trim().replace(/^"|"$/g, '')}&rdquo;`;
            } else {
                throw new Error("Réponse de l'IA vide ou inattendue.");
            }

        } catch (error) {
            console.error("Erreur lors de la génération du témoignage:", error);
            genErrorBox.classList.remove('hidden');
            generatedTestimonial.innerHTML = 'Impossible de générer le témoignage pour le moment.';
        } finally {
            // Hide loading state
            generateTestimonialButton.disabled = false;
            genLoadingIndicator.classList.add('hidden');
            genButtonText.textContent = 'Générer le Témoignage'; 
        }
    });
});
