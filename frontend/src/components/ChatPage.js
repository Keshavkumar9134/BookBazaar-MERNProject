import React, { useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import './ChatPage.css';
import { AuthContext } from '../context/AuthContext';
import API_BASE_URL, { apiUrl } from '../api';

const ChatPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [activeUser, setActiveUser] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user?.token) {
      navigate('/login');
    }
  }, [navigate, user]);

  const authConfig = user?.token
    ? {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }
    : null;

  const fetchConversations = async () => {
    if (!authConfig) {
      return;
    }

    try {
      const response = await axios.get(apiUrl('/api/chat/conversations'), authConfig);
      setConversations(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load conversations.');
    }
  };

  const fetchUsers = async (searchValue = '') => {
    if (!authConfig) {
      return;
    }

    try {
      const response = await axios.get(apiUrl('/api/users'), {
        ...authConfig,
        params: searchValue ? { search: searchValue } : {},
      });
      setUsers(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load users.');
    }
  };

  const markConversationAsRead = async (targetConversationId) => {
    if (!authConfig || !targetConversationId) {
      return;
    }

    try {
      await axios.post(
        apiUrl(`/api/chat/conversations/${targetConversationId}/read`),
        {},
        authConfig
      );
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  };

  const fetchMessages = async (targetUser, options = {}) => {
    if (!authConfig || !targetUser) {
      return;
    }

    const { markAsRead = true, showLoader = true } = options;

    try {
      if (showLoader) {
        setLoadingMessages(true);
      }
      setError('');
      const response = await axios.get(
        apiUrl(`/api/chat/messages/${targetUser.id}`),
        authConfig
      );

      setActiveUser(response.data.participant);
      setConversationId(response.data.conversationId);
      setMessages(response.data.messages);

      if (markAsRead && response.data.conversationId) {
        await markConversationAsRead(response.data.conversationId);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load messages.');
    } finally {
      if (showLoader) {
        setLoadingMessages(false);
      }
    }
  };

  useEffect(() => {
    if (!authConfig) {
      return;
    }

    fetchConversations();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token]);

  useEffect(() => {
    if (!authConfig) {
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchUsers(search);
    }, 250);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, user?.token]);

  useEffect(() => {
    if (!user?.token) {
      return undefined;
    }

    const streamUrl = `${API_BASE_URL}/api/chat/stream?token=${encodeURIComponent(user.token)}`;
    const eventSource = new EventSource(streamUrl);

    eventSource.onmessage = async (event) => {
      const payload = JSON.parse(event.data);

      if (payload.type === 'chat:message' || payload.type === 'chat:read') {
        await fetchConversations();

        if (
          activeUser &&
          (payload.message?.sender?.id === activeUser.id ||
            payload.message?.recipient?.id === activeUser.id ||
            payload.conversationId === conversationId)
        ) {
          await fetchMessages(activeUser, {
            markAsRead: false,
            showLoader: false,
          });
        }
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUser, conversationId, user?.token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectUser = (targetUser) => {
    fetchMessages(targetUser);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!authConfig || !activeUser || !messageText.trim()) {
      return;
    }

    try {
      setSending(true);
      setError('');
      await axios.post(
        apiUrl(`/api/chat/messages/${activeUser.id}`),
        { content: messageText },
        authConfig
      );
      setMessageText('');
      await fetchMessages(activeUser, {
        markAsRead: false,
        showLoader: false,
      });
      await fetchConversations();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send message.');
    } finally {
      setSending(false);
    }
  };

  const conversationByUserId = conversations.reduce((acc, conversation) => {
    if (conversation.participant?.id) {
      acc[conversation.participant.id] = conversation;
    }
    return acc;
  }, {});

  const visibleUsers = users.filter(
    (listedUser) => !activeUser || listedUser.id !== activeUser.id
  );

  if (!user?.token) {
    return null;
  }

  return (
    <div className="chat-page">
      <Header />
      <div className="chat-layout">
        <aside className="chat-sidebar">
          <div className="chat-section">
            <h2>Inbox</h2>
            <p className="chat-subtitle">Your recent conversations update instantly.</p>
            <div className="chat-list">
              {conversations.length === 0 && (
                <p className="chat-empty">No conversations yet. Start one from the people list.</p>
              )}
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  className={`chat-list-item ${
                    activeUser?.id === conversation.participant.id ? 'active' : ''
                  }`}
                  onClick={() => handleSelectUser(conversation.participant)}
                >
                  <div>
                    <strong>{conversation.participant.username}</strong>
                    <span>{conversation.participant.email}</span>
                  </div>
                  <div className="chat-meta">
                    {conversation.unreadCount > 0 && (
                      <span className="chat-badge">{conversation.unreadCount}</span>
                    )}
                    <small>
                      {conversation.lastMessageAt
                        ? new Date(conversation.lastMessageAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </small>
                  </div>
                  <p>{conversation.lastMessageText || 'Conversation started'}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="chat-section">
            <h2>People</h2>
            <input
              type="text"
              className="chat-search"
              placeholder="Search by username or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="chat-list">
              {visibleUsers.length === 0 && (
                <p className="chat-empty">No users matched your search.</p>
              )}
              {visibleUsers.map((listedUser) => {
                const existingConversation = conversationByUserId[listedUser.id];

                return (
                  <button
                    key={listedUser.id}
                    className={`chat-list-item ${
                      activeUser?.id === listedUser.id ? 'active' : ''
                    }`}
                    onClick={() => handleSelectUser(listedUser)}
                  >
                    <div>
                      <strong>{listedUser.username}</strong>
                      <span>{listedUser.email}</span>
                    </div>
                    <p>
                      {existingConversation
                        ? existingConversation.lastMessageText || 'Open conversation'
                        : 'Start a new conversation'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="chat-panel">
          <div className="chat-panel-header">
            <div>
              <h2>{activeUser ? activeUser.username : 'Select a conversation'}</h2>
              <p>
                {activeUser
                  ? `Chatting with ${activeUser.email}`
                  : 'Choose someone from the inbox or people list to begin.'}
              </p>
            </div>
          </div>

          {error && <div className="chat-error">{error}</div>}

          <div className="chat-messages">
            {!activeUser && (
              <div className="chat-placeholder">
                <h3>Real-time user chat</h3>
                <p>Messages appear here as soon as they are sent.</p>
              </div>
            )}

            {activeUser && loadingMessages && (
              <div className="chat-placeholder">
                <p>Loading messages...</p>
              </div>
            )}

            {activeUser &&
              !loadingMessages &&
              messages.map((message) => {
                const isOwnMessage = message.sender.id === user.id;

                return (
                  <div
                    key={message.id}
                    className={`chat-bubble ${isOwnMessage ? 'own' : 'other'}`}
                  >
                    <span className="chat-author">
                      {isOwnMessage ? 'You' : message.sender.username}
                    </span>
                    <p>{message.content}</p>
                    <small>
                      {new Date(message.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </small>
                  </div>
                );
              })}

            {activeUser && !loadingMessages && messages.length === 0 && (
              <div className="chat-placeholder">
                <p>No messages yet. Say hello to start the conversation.</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-composer" onSubmit={handleSendMessage}>
            <textarea
              placeholder={
                activeUser ? 'Type your message...' : 'Select a user to start chatting'
              }
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              disabled={!activeUser || sending}
              rows={3}
            />
            <button type="submit" disabled={!activeUser || sending || !messageText.trim()}>
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default ChatPage;
