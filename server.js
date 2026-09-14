import fs from 'fs';

const HISTORY_FILE = 'rank_history.json';

function getRankHistory() {
  if (!fs.existsSync(HISTORY_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

export function processTrends(categoryKey, items) {
  const history = getRankHistory();
  const previousRanks = history[categoryKey] || {};
  const currentRanks = {};

  const itemsWithTrends = items.map((item, index) => {
    const currentRank = index + 1;
    currentRanks[item.id] = currentRank;
    const previousRank = previousRanks[item.id];

    let trendSymbol = '[ NEW ]'; // New entry
    let trendStatus = 'new';

    if (previousRank !== undefined) {
      if (currentRank < previousRank) {
        trendSymbol = '[ ▲ ]';
        trendStatus = 'up';
      } else if (currentRank > previousRank) {
        trendSymbol = '[ ▼ ]';
        trendStatus = 'down';
      } else {
        trendSymbol = '';
        trendStatus = 'same';
      }
    }

    return {
      ...item,
      trend: {
        symbol: trendSymbol,
        status: trendStatus,
        delta: previousRank ? previousRank - currentRank : null
      }
    };
  });

  // Save current positions for future comparison
  history[categoryKey] = currentRanks;
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));

  return itemsWithTrends;
}