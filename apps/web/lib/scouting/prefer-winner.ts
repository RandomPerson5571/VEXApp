/** Put winner directly above loser in the ranked list; pull both out of DNP. */
export function preferWinnerInPicklist(
  orderedNoteIds: string[],
  dnpNoteIds: string[],
  winnerId: string,
  loserId: string,
): { orderedNoteIds: string[]; dnpNoteIds: string[] } {
  if (winnerId === loserId) {
    return { orderedNoteIds, dnpNoteIds };
  }

  const winnerIdx = orderedNoteIds.indexOf(winnerId);
  const loserIdx = orderedNoteIds.indexOf(loserId);

  const ranked = orderedNoteIds.filter(
    (id) => id !== winnerId && id !== loserId,
  );
  const dnp = dnpNoteIds.filter((id) => id !== winnerId && id !== loserId);

  let insertAt: number;
  if (winnerIdx >= 0 && loserIdx >= 0) {
    insertAt = Math.min(winnerIdx, loserIdx);
  } else if (winnerIdx >= 0) {
    insertAt = winnerIdx;
  } else if (loserIdx >= 0) {
    insertAt = loserIdx;
  } else {
    insertAt = ranked.length;
  }

  ranked.splice(insertAt, 0, winnerId, loserId);
  return { orderedNoteIds: ranked, dnpNoteIds: dnp };
}
