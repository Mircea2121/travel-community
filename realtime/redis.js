import { createClient } from "redis";

const REDIS_RECONNECT_MAX_DELAY_MS = 5_000;

let publisher = null;
let subscriber = null;
let connectionPromise = null;

function getRedisUrl() {
  const redisUrl = process.env.REDIS_URL?.trim();

  if (!redisUrl) {
    throw new Error(
      "REDIS_URL nu este definit în variabilele de mediu."
    );
  }

  return redisUrl;
}

function reconnectStrategy(retries) {
  return Math.min(
    100 * 2 ** Math.min(retries, 6),
    REDIS_RECONNECT_MAX_DELAY_MS
  );
}

function attachClientEvents(client, name) {
  client.on("error", (error) => {
    console.error(`[Redis:${name}]`, error);
  });

  client.on("reconnecting", () => {
    console.warn(`[Redis:${name}] Se reconectează...`);
  });
}

function createRedisClients() {
  const redisUrl = getRedisUrl();

  const nextPublisher = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy,
    },
  });

  const nextSubscriber = nextPublisher.duplicate();

  attachClientEvents(nextPublisher, "publisher");
  attachClientEvents(nextSubscriber, "subscriber");

  return {
    publisher: nextPublisher,
    subscriber: nextSubscriber,
  };
}

export async function connectRedis() {
  if (
    publisher?.isReady &&
    subscriber?.isReady
  ) {
    return {
      publisher,
      subscriber,
    };
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    if (!publisher || !subscriber) {
      const clients = createRedisClients();

      publisher = clients.publisher;
      subscriber = clients.subscriber;
    }

    try {
      await Promise.all([
        publisher.isOpen
          ? Promise.resolve()
          : publisher.connect(),
        subscriber.isOpen
          ? Promise.resolve()
          : subscriber.connect(),
      ]);

      return {
        publisher,
        subscriber,
      };
    } catch (error) {
      await Promise.allSettled([
        closeClient(publisher),
        closeClient(subscriber),
      ]);

      publisher = null;
      subscriber = null;

      throw error;
    } finally {
      connectionPromise = null;
    }
  })();

  return connectionPromise;
}

export function getRedisClients() {
  if (!publisher?.isReady || !subscriber?.isReady) {
    throw new Error(
      "Redis nu este conectat. Apelează connectRedis() înainte de utilizare."
    );
  }

  return {
    publisher,
    subscriber,
  };
}

async function closeClient(client) {
  if (!client?.isOpen) {
    return;
  }

  try {
    await client.quit();
  } catch {
    if (typeof client.destroy === "function") {
      client.destroy();
      return;
    }

    if (typeof client.disconnect === "function") {
      client.disconnect();
    }
  }
}

export async function closeRedis() {
  const clients = [publisher, subscriber];

  publisher = null;
  subscriber = null;
  connectionPromise = null;

  await Promise.allSettled(clients.map(closeClient));
}
