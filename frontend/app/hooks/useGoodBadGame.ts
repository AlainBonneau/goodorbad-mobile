import { useCallback, useMemo, useRef, useState } from "react";
import { api } from "../services/api";
import { Card, CardType } from "../types";
import { shuffle } from "../utils/shuffle";

export const MAX_ATTEMPTS = 5;

export default function useGoodBadGame() {
  const [name, setName] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [draws, setDraws] = useState<Card[]>([]);
  const [lastCard, setLastCard] = useState<Card | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [showFinalCards, setShowFinalCards] = useState(false);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [finalCard, setFinalCard] = useState<Card | null>(null);
  const [error, setError] = useState<string | null>(null);
  const flipKeyRef = useRef(0);

  const attempts = draws.length;
  const goodCount = useMemo(
    () => draws.filter((d) => d.type === "good").length,
    [draws]
  );
  const badCount = attempts - goodCount;

  const canDraw = attempts < MAX_ATTEMPTS && !finalCard;
  const canTypeName = canDraw && !finalCard;

  const shuffledCards = useMemo(
    () => (attempts === MAX_ATTEMPTS ? shuffle(draws) : []),
    [attempts, draws]
  );

  const startSessionIfNeeded = useCallback(async () => {
    if (sessionId) return sessionId;
    const res = await api.createSession(name.trim() || "Invité");
    setSessionId(res.id);
    return res.id;
  }, [name, sessionId]);

  const draw = useCallback(async () => {
    if (!canDraw) return;
    try {
      setError(null);
      const id = await startSessionIfNeeded();
      setIsFlipping(true);
      const { card } = await api.draw(id);
      setLastCard(card);
      setDraws((prev) => [...prev, card]);
      flipKeyRef.current += 1;
    } catch (e: any) {
      setError(e.message || "Une erreur est survenue");
      setIsFlipping(false);
    }
  }, [canDraw, startSessionIfNeeded]);

  const revealFinalChoices = useCallback(() => {
    setShowFinalCards(true);
  }, []);

  const pickFinal = useCallback(
    async (index: number) => {
      if (pickedIndex !== null || !sessionId) return;
      try {
        setError(null);
        const { final, pickedIndex: serverIndex } = await api.finalPick(
          sessionId,
          index
        );
        setPickedIndex(serverIndex ?? index);
        setFinalCard(final);
      } catch (e: any) {
        setError(e.message || "Impossible de valider le choix");
      }
    },
    [pickedIndex, sessionId]
  );

  return {
    name,
    setName,
    sessionId,
    draws,
    lastCard,
    isFlipping,
    showFinalCards,
    pickedIndex,
    finalCard,
    error,
    attempts,
    goodCount,
    badCount,
    canDraw,
    canTypeName,
    shuffledCards,
    draw,
    revealFinalChoices,
    pickFinal,
    flipKeyRef,
    setDraws,
    setShowFinalCards,
    setPickedIndex,
    setFinalCard,
    setError,
  };
}
