const pickCard = async (card: MTGCard) => {
  if (!draftSession) {
    return;
  }

  // Add card to user picks
  const updatedUserPicks = [
    ...draftSession.user_picks.filter((c) => c !== null),
    card,
  ];

  // Remove picked card from current pack
  let updatedPack = currentPack.filter((c) => c.id !== card.id);

  // Process AI picks one at a time (proper pack passing)
  const updatedAiPlayers = { ...(draftSession.ai_players || {}) };

  // Simulate pack passing around the table (7 AI players pick before pack returns to user)
  for (let aiPlayer = 1; aiPlayer <= 7; aiPlayer++) {
    if (updatedPack.length === 0) {
      break;
    }

    const aiPick = pickAICard(updatedPack);
    if (aiPick) {
      // Add to the specific AI player's picks
      const playerKey = `player${aiPlayer}` as keyof typeof updatedAiPlayers;
      updatedAiPlayers[playerKey] = [
        ...updatedAiPlayers[playerKey].filter((c) => c !== null),
        aiPick,
      ];

      // Remove AI pick from pack
      updatedPack = updatedPack.filter((c) => c.id !== aiPick.id);
    }
  }

  const newPickNumber = draftSession.current_pick + 1;
  const newPackNumber =
    newPickNumber > draftSession.picks_per_pack
      ? draftSession.current_pack + 1
      : draftSession.current_pack;

  const updatedSession: DraftSession = {
    ...draftSession,
    current_pick:
      newPickNumber > draftSession.picks_per_pack ? 1 : newPickNumber,
    current_pack: newPackNumber,
    user_picks: updatedUserPicks,
    ai_players: updatedAiPlayers,
    status: newPackNumber > draftSession.total_packs ? "completed" : "active",
  };

  setDraftSession(updatedSession);
  setCurrentPack(updatedPack);
  localStorage.setItem("mtg_draft_session", JSON.stringify(updatedSession));

  if (updatedSession.status === "completed") {
    toast.success("Draft completed! Saving your draft...");
    await saveDraft(updatedSession);
  } else if (
    updatedPack.length === 0 ||
    newPackNumber > draftSession.current_pack
  ) {
    // Start next pack when current pack is exhausted or we move to next pack
    await generatePack(newPackNumber, draftSession.set_code);
  }
};
