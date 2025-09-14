import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'token-list-db';
const DB_VERSION = 1;
const STORE_NAME = 'tokens';

export interface TokenData {
  account_id: string;
  name: string;
  symbol: string;
}

let db: IDBPDatabase | null = null;

async function getDb(): Promise<IDBPDatabase> {
  if (db) {
    return db;
  }

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'account_id' });
      }
    },
  });

  return db;
}

export async function saveTokensToDB(tokens: TokenData[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  for (const token of tokens) {
    store.put(token);
  }

  await tx.done;
}

export async function getTokensFromDB(): Promise<TokenData[]> {
  const db = await getDb();
  return db.getAll(STORE_NAME);
}

export async function fetchAndStoreTokenList(): Promise<void> {
  try {
    const response = await fetch('https://prices.intear.tech/tokens');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    const tokens: TokenData[] = Object.values(data).map((token: any) => ({
      account_id: token.account_id,
      name: token.name || token.account_id.split('.')[0],
      symbol: token.symbol || token.account_id.split('.')[0].toUpperCase(),
    }));

    await saveTokensToDB(tokens);
  } catch (error) {
    console.error('Failed to fetch and store token list:', error);
  }
}
