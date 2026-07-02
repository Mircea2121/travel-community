export const USER_LEVELS = {
  NOVICE: "Novice călător",
  EXPLORER: "Explorator",
  ACTIVE: "Călător activ",
  EXPERT: "Expert călător",
  VETERAN: "Veteran călător",
};

export function calculateUserLevel(userStats = {}) {
  const postsCount = userStats.postsCount || 0;
  const destinationsCount = userStats.destinationsCount || 0;
  const likesReceived = userStats.likesReceived || 0;
  const commentsCount = userStats.commentsCount || 0;

  const score =
    postsCount * 10 +
    destinationsCount * 15 +
    likesReceived * 2 +
    commentsCount * 3;

  if (score >= 500) {
    return USER_LEVELS.VETERAN;
  }

  if (score >= 300) {
    return USER_LEVELS.EXPERT;
  }

  if (score >= 150) {
    return USER_LEVELS.ACTIVE;
  }

  if (score >= 50) {
    return USER_LEVELS.EXPLORER;
  }

  return USER_LEVELS.NOVICE;
}

export function getNextUserLevel(userStats = {}) {
  const postsCount = userStats.postsCount || 0;
  const destinationsCount = userStats.destinationsCount || 0;
  const likesReceived = userStats.likesReceived || 0;
  const commentsCount = userStats.commentsCount || 0;

  const score =
    postsCount * 10 +
    destinationsCount * 15 +
    likesReceived * 2 +
    commentsCount * 3;

  if (score < 50) {
    return {
      currentScore: score,
      nextLevel: USER_LEVELS.EXPLORER,
      pointsNeeded: 50 - score,
    };
  }

  if (score < 150) {
    return {
      currentScore: score,
      nextLevel: USER_LEVELS.ACTIVE,
      pointsNeeded: 150 - score,
    };
  }

  if (score < 300) {
    return {
      currentScore: score,
      nextLevel: USER_LEVELS.EXPERT,
      pointsNeeded: 300 - score,
    };
  }

  if (score < 500) {
    return {
      currentScore: score,
      nextLevel: USER_LEVELS.VETERAN,
      pointsNeeded: 500 - score,
    };
  }

  return {
    currentScore: score,
    nextLevel: null,
    pointsNeeded: 0,
  };
}