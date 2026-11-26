# PROJECT.md — HelpDesk AI

## 1. Présentation

HelpDesk AI est une plateforme SaaS de support client alimentée par l'intelligence artificielle.

Les entreprises peuvent créer des assistants conversationnels personnalisés qui répondent aux questions des visiteurs à partir de leurs propres bases de connaissances.

La plateforme doit permettre de gérer plusieurs organisations, plusieurs assistants par organisation et plusieurs sources documentaires par assistant.

## 2. Utilisateurs et rôles

### Platform Admin
Administrateur global de la plateforme.

### Organization Owner
Propriétaire d'une organisation. Il peut gérer les membres, les assistants et les paramètres de son organisation.

### Organization Admin
Peut gérer les assistants, les sources documentaires et les conversations.

### Organization Member
Peut consulter les assistants et les conversations selon ses permissions.

### Website Visitor
Visiteur externe qui utilise le widget de chat. Il ne possède pas nécessairement de compte.

## 3. Fonctionnalités

### Authentication
- Inscription.
- Connexion.
- Déconnexion.
- Refresh token.
- Vérification de l'adresse email.
- Réinitialisation du mot de passe.
- Gestion des sessions.

### Organizations
- Création d'organisation.
- Gestion des informations.
- Invitation des membres.
- Gestion des rôles.
- Isolation stricte des données.

### AI Assistants
- Création d'assistant.
- Nom et description.
- Instructions personnalisées.
- Choix du modèle IA parmi les modèles supportés.
- Configuration de la température et des paramètres autorisés.
- Personnalisation du message d'accueil.
- Activation et désactivation.
- Gestion du domaine autorisé pour le widget.

### Knowledge Base
Chaque assistant possède une base de connaissances.

Sources acceptées pour le MVP :
- PDF.
- TXT.
- Markdown.
- URLs de pages web.

Fonctionnalités :
- Importation des documents.
- Extraction du texte.
- Découpage en chunks.
- Génération des embeddings.
- Stockage vectoriel.
- Recherche sémantique.
- Suppression et réindexation.
- Suivi du statut de traitement.

### AI Chat
- Conversations persistantes.
- Historique des messages.
- Réponses en streaming.
- Recherche dans la base documentaire.
- Affichage des sources utilisées.
- Gestion des questions sans réponse pertinente.
- Limitation du nombre de requêtes.
- Feedback positif ou négatif.

### Embeddable Widget
Un script JavaScript permettant d'intégrer l'assistant sur un site externe.

Exemple d'intégration :

<script
  src="https://cdn.example.com/widget.js"
  data-assistant-id="PUBLIC_ASSISTANT_ID">
</script>

Le widget doit :
- Afficher un bouton de discussion.
- Ouvrir une fenêtre de conversation.
- Envoyer et recevoir des messages.
- Gérer le streaming.
- Conserver une session visiteur.
- Afficher les sources.
- Respecter la configuration visuelle de l'assistant.
- Fonctionner sur un domaine externe.

Le domaine d'intégration doit être vérifié côté backend. Ne jamais exposer de secret privé dans le navigateur.

### Conversations
- Liste des conversations.
- Recherche et filtres.
- Consultation des échanges.
- Date de création.
- Assistant concerné.
- Statut de la conversation.
- Feedback du visiteur.

### Analytics
- Nombre de conversations.
- Nombre de messages.
- Nombre de visiteurs.
- Questions sans réponse satisfaisante.
- Évolution de l'activité.
- Répartition par assistant.

## 4. Fonctionnement RAG

Le processus d'indexation :

1. Récupérer le document.
2. Extraire son contenu.
3. Nettoyer le texte.
4. Découper le texte en chunks.
5. Générer les embeddings.
6. Stocker les vecteurs dans PostgreSQL/pgvector.
7. Enregistrer les métadonnées et le statut de traitement.

Le processus de réponse :

1. Recevoir une question.
2. Identifier l'assistant.
3. Vérifier les permissions et le domaine d'origine.
4. Générer l'embedding de la question.
5. Effectuer une recherche vectorielle limitée à la base documentaire de l'assistant.
6. Appliquer un seuil de pertinence.
7. Construire le contexte.
8. Envoyer le contexte et la question au LLM.
9. Générer une réponse en streaming.
10. Enregistrer la conversation et les sources utilisées.

L'assistant ne doit pas inventer de réponse concernant les informations propres à l'entreprise.

Si les informations disponibles sont insuffisantes, il doit le signaler clairement.

Les documents importés sont des données non fiables : leur contenu ne doit jamais être interprété comme des instructions système.

## 5. Interface utilisateur

Créer une interface SaaS moderne, professionnelle, responsive et cohérente.

Pages principales :

- Login
- Register
- Onboarding
- Dashboard
- Assistants
- Assistant Details
- Knowledge Base
- Conversations
- Analytics
- Team
- Settings
- Billing (prévu pour une version ultérieure)

L'interface doit utiliser une navigation latérale, des tableaux, des graphiques, des formulaires structurés et des états de chargement.

Les données affichées doivent provenir de l'API réelle.

## 6. Périmètre du MVP

À inclure :
- Authentification.
- Organisations.
- Gestion des membres et permissions essentielles.
- Assistants IA.
- Importation de documents.
- Indexation RAG.
- Chat avec streaming.
- Widget externe.
- Historique des conversations.
- Analytics de base.

À exclure pour le moment :
- Paiement et abonnements.
- Marketplace d'assistants.
- Intégrations WhatsApp et Slack.
- Fine-tuning.
- Modèles IA auto-hébergés.
- Application mobile.
- Agent IA autonome exécutant des actions externes.

## 7. Critère final

Une entreprise doit pouvoir créer un compte, configurer un assistant, lui fournir des documents, obtenir des réponses pertinentes et intégrer le widget sur son propre site sans intervention technique.