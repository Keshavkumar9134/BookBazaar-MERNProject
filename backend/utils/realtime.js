const clientsByUserId = new Map();

const sendEvent = (client, payload) => {
  client.write(`data: ${JSON.stringify(payload)}\n\n`);
};

const addRealtimeClient = (userId, client) => {
  const normalizedUserId = String(userId);

  if (!clientsByUserId.has(normalizedUserId)) {
    clientsByUserId.set(normalizedUserId, new Set());
  }

  clientsByUserId.get(normalizedUserId).add(client);
};

const removeRealtimeClient = (userId, client) => {
  const normalizedUserId = String(userId);
  const clients = clientsByUserId.get(normalizedUserId);

  if (!clients) {
    return;
  }

  clients.delete(client);

  if (clients.size === 0) {
    clientsByUserId.delete(normalizedUserId);
  }
};

const publishToUsers = (userIds, payload) => {
  userIds.forEach((userId) => {
    const clients = clientsByUserId.get(String(userId));

    if (!clients) {
      return;
    }

    clients.forEach((client) => {
      sendEvent(client, payload);
    });
  });
};

module.exports = {
  addRealtimeClient,
  removeRealtimeClient,
  publishToUsers,
  sendEvent,
};
