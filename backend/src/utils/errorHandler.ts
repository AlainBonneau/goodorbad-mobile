export const ERROR_MESSAGES = {
  OWNER_KEY_REQUIRED: "L'en-tête x-owner-key est requis.",
  SESSION_NOT_FOUND: "Session non trouvée.",
  FORBIDDEN: "Vous n'avez pas la permission d'accéder à cette session.",
  SESSION_FINALIZED: "Session déjà finalisée.",
  DRAW_LIMIT_REACHED: "Limite de tirage atteinte.",
  INVALID_PICK_INDEX: "L'index de sélection doit être entre 0 et 4.",
  NEED_5_CARDS: "Vous devez tirer exactement 5 cartes avant de finaliser.",
  INVALID_CARD_INDEX: "Index de carte invalide.",
  INTERNAL_ERROR: "Erreur interne du serveur.",
} as const;

export function handleError(error: any, res: any) {
  const code = error.message;
  const message = ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES];

  if (message) {
    const statusCode = getStatusCode(code);
    return res.status(statusCode).json({
      success: false,
      error: { code, message },
    });
  }

  console.error("Unhandled error:", error);
  return res.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message: ERROR_MESSAGES.INTERNAL_ERROR },
  });
}

function getStatusCode(code: string): number {
  const statusMap: Record<string, number> = {
    OWNER_KEY_REQUIRED: 400,
    SESSION_NOT_FOUND: 404,
    FORBIDDEN: 403,
    SESSION_FINALIZED: 400,
    DRAW_LIMIT_REACHED: 400,
    INVALID_PICK_INDEX: 400,
    NEED_5_CARDS: 400,
    INVALID_CARD_INDEX: 400,
    INTERNAL_ERROR: 500,
  };
  return statusMap[code] || 500;
}
