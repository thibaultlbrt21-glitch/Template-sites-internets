/* =========================================================================
   PILLIARD MENUISERIE AGENCEMENT — coordonnées et réglages
   C'est le SEUL fichier à modifier pour mettre les vraies coordonnées :
   elles sont reportées partout sur la page (boutons Appeler, Écrire,
   cartes de contact, formulaire de devis).
   ========================================================================= */
window.PMA_CONFIG = {
  // Affiché tel quel ; le lien d'appel est construit automatiquement.
  telephone: "06 00 00 00 00",
  email: "contact@pilliard-menuiserie.fr",

  // Laisser vide pour afficher « Visite sur rendez-vous ».
  adresse: "",
  horaires: "Du lundi au vendredi",

  devis: {
    // Adresse qui RECEVRA les demandes de devis du formulaire.
    // Vide = mode démonstration : le formulaire fonctionne mais n'envoie rien
    // (un message le précise au visiteur).
    // Rempli = envoi réel via FormSubmit (gratuit, sans compte) : la toute
    // première demande déclenche un e-mail « Activate Form » à cette adresse,
    // il suffit de cliquer une fois sur le bouton pour activer l'envoi.
    destinataire: "",
    service: "https://formsubmit.co/ajax/"
  }
};
