export function orderedPair(userAId: string, userBId: string) {
  return [userAId, userBId].sort() as [string, string];
}

export function isMutualLike(existingAction?: "LIKE" | "SKIP", nextAction?: "LIKE" | "SKIP") {
  return existingAction === "LIKE" && nextAction === "LIKE";
}

export function trendingScore(likes: number, comments: number, createdAt: Date, now = new Date()) {
  const ageHours = Math.max(1, (now.getTime() - createdAt.getTime()) / 36e5);
  return (likes * 2 + comments * 3) / ageHours;
}
