import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect if running as root and use appropriate path
function getHistoryFilePath() {
  const uid = process.getuid?.() || null;
  
  if (uid === 0) {
    // Running via cron, use home directory
    const homeDir = process.env.HOME || '/root';
    const filePath = path.join(homeDir, '.spotify_rank_history.json');
    console.log(`[TRENDS] Running as root, using: ${filePath}`);
    return filePath;
  } else {
    // Else use project directory
    const filePath = path.join(__dirname, 'rank_history.json');
    console.log(`[TRENDS] Running as user ${uid}, using: ${filePath}`);
    return filePath;
  }
}

const HISTORY_FILE = getHistoryFilePath();

function getRankHistory() {
  console.log(`[TRENDS] Resolved history file path: ${HISTORY_FILE}`);
  if (!fs.existsSync(HISTORY_FILE)) {
    console.log(`[TRENDS] No existing history file found at path.`);
    return {};
  }
  try {
    const rawData = fs.readFileSync(HISTORY_FILE, 'utf-8');
    console.log(`[TRENDS] Successfully read history file contents.`);
    return JSON.parse(rawData);
  } catch (err) {
    console.error(`[TRENDS ERROR] Failed to parse history JSON:`, err.message);
    return {};
  }
}

export function processTrends(categoryKey, items) {
  console.log(`[TRENDS] processTrends called for category: "${categoryKey}"`);

  if (!Array.isArray(items)) {
    console.error(`[TRENDS ERROR] 'items' is not an array. Value received:`, items);
    return items;
  }

  console.log(`[TRENDS] Processing ${items.length} items for "${categoryKey}"...`);
  const history = getRankHistory();
  const previousRanks = history[categoryKey] || {};
  const currentRanks = {};

  const itemsWithTrends = items.map((item, index) => {
    const currentRank = index + 1;
    currentRanks[item.id] = currentRank;
    const previousRank = previousRanks[item.id];

    let trendSymbol = '[ NEW ]';
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

  history[categoryKey] = currentRanks;

  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
    console.log(`[TRENDS SUCCESS] Successfully wrote rank data to: ${HISTORY_FILE}`);
  } catch (err) {
    console.error(`[TRENDS ERROR] Failed to write file to disk:`, err.message);
  }

  return itemsWithTrends;
}