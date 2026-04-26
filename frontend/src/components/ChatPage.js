import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import './ChatPage.css';
import { AuthContext } from '../context/AuthContext';
import API_BASE_URL, { apiUrl } from '../api';

const botAvatar = 'https://cdn-icons-png.flaticon.com/512/4712/4712109.png';

const ChatPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [supportAdmins, setSupportAdmins] = useState([]);
  const [search, setSearch] = useState('');
  const [activeUser, setActiveUser] = useState(null);
  const [activeCategory, setActiveCategory] = useState('users');
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantSending, setAssistantSending] = useState(false);
  const [assistantError, setAssistantError] = useState('');
  const [assistantMessages, setAssistantMessages] = useState([
    {
      id: 'assistant-welcome',
      role: 'assistant',
      text: 'Hi there. I am your BookBazaar assistant. Ask me how to order a book, where to view all books, how to edit address, how payments work, or how to contact etc.',
    },
  ]);
  const messagesEndRef = useRef(null);
  const assistantEndRef = useRef(null);

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
    if (!authConfig) return;

    try {
      const response = await axios.get(apiUrl('/api/chat/conversations'), authConfig);
      setConversations(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load conversations.');
    }
  };

  const fetchUsers = async (searchValue = '') => {
    if (!authConfig) return;

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

  const fetchSupportAdmins = async () => {
    if (!authConfig) return;

    try {
      const response = await axios.get(apiUrl('/api/users/admin-support'), authConfig);
      setSupportAdmins(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load support contacts.');
    }
  };

  const markConversationAsRead = async (targetConversationId) => {
    if (!authConfig || !targetConversationId) return;

    try {
      await axios.post(apiUrl(`/api/chat/conversations/${targetConversationId}/read`), {}, authConfig);
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  };

  const fetchMessages = async (targetUser, options = {}) => {
    if (!authConfig || !targetUser) return;

    const { markAsRead = true, showLoader = true, category = 'users' } = options;

    try {
      if (showLoader) setLoadingMessages(true);
      setError('');
      const response = await axios.get(apiUrl(`/api/chat/messages/${targetUser.id}`), authConfig);

      setActiveUser(response.data.participant);
      setActiveCategory(category);
      setConversationId(response.data.conversationId);
      setMessages(response.data.messages);

      if (markAsRead && response.data.conversationId) {
        await markConversationAsRead(response.data.conversationId);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load messages.');
    } finally {
      if (showLoader) setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!authConfig) return;
    fetchConversations();
    fetchUsers();
    fetchSupportAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token]);

  useEffect(() => {
    if (!authConfig) return;

    const timeoutId = setTimeout(() => {
      fetchUsers(search);
    }, 250);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, user?.token]);

  useEffect(() => {
    if (!user?.token) return undefined;

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
            category: activeCategory,
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
  }, [activeUser, conversationId, user?.token, activeCategory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (assistantOpen) {
      assistantEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [assistantMessages, assistantOpen]);

  const conversationByUserId = useMemo(
    () =>
      conversations.reduce((acc, conversation) => {
        if (conversation.participant?.id) {
          acc[conversation.participant.id] = conversation;
        }
        return acc;
      }, {}),
    [conversations]
  );

  const visibleUsers = users.filter((listedUser) => !activeUser || listedUser.id !== activeUser.id);
  const helpContact = supportAdmins[0] || null;
  const userConversations = conversations.filter((conversation) => conversation.participant?.role !== 'admin');
  const helpConversation = helpContact ? conversationByUserId[helpContact.id] : null;

  const handleSelectUser = (targetUser, category = 'users') => {
    fetchMessages(targetUser, { category });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!authConfig || !activeUser || !messageText.trim()) return;

    try {
      setSending(true);
      setError('');
      await axios.post(apiUrl(`/api/chat/messages/${activeUser.id}`), { content: messageText }, authConfig);
      setMessageText('');
      await fetchMessages(activeUser, {
        markAsRead: false,
        showLoader: false,
        category: activeCategory,
      });
      await fetchConversations();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send message.');
    } finally {
      setSending(false);
    }
  };

  const sendAssistantMessage = async (inputText) => {
    const trimmed = inputText.trim();
    if (!trimmed || !authConfig) return;

    setAssistantError('');
    setAssistantSending(true);
    const timestamp = Date.now();
    const userMessage = {
      id: `user-${timestamp}`,
      role: 'user',
      text: trimmed,
    };

    const nextMessages = [...assistantMessages, userMessage];
    setAssistantMessages(nextMessages);
    setAssistantInput('');

    try {
      const response = await axios.post(
        apiUrl('/api/assistant/chat'),
        {
          messages: nextMessages,
        },
        authConfig
      );

      setAssistantMessages((current) => [
        ...current,
        {
          id: `assistant-${timestamp + 1}`,
          role: 'assistant',
          text: response.data.reply,
        },
      ]);
    } catch (err) {
      setAssistantError(err.response?.data?.message || 'Could not get AI response.');
    } finally {
      setAssistantSending(false);
    }
  };

  const handleAssistantSend = async (e) => {
    e.preventDefault();
    await sendAssistantMessage(assistantInput);
  };

  const openAssistantWithPrompt = async (prompt) => {
    setAssistantOpen(true);
    if (!prompt) return;
    await sendAssistantMessage(prompt);
  };

  if (!user?.token) {
    return null;
  }

  return (
    <div className="chat-page contact-page-shell">
      <Header />
      <div className="contact-page">
        <section className="contact-hero">
          <div>
            <h1 className="contact-kicker">Contact</h1>
            <h5>Stay connected with readers, supporter, and your floating AI assistant.</h5>
          </div>
          <div className="contact-hero-stats">
            <div className="contact-stat-card">
              <strong>{userConversations.length}</strong>
              <span>Readers</span>
            </div> 
            <div className="contact-stat-card">
              <strong>{helpContact ? 'Live' : 'Soon'}</strong>
              <span>Supporter</span>
            </div>
          </div>
        </section>

        <div className="contact-layout two-column">
          <aside className="contact-sidebar">
            <div className="contact-section contact-cards">
              <button
                className={`contact-mode-card ${activeCategory === 'help' ? 'active' : ''}`}
                onClick={() => {
                  setActiveCategory('help');
                  if (helpContact) {
                    handleSelectUser(helpContact, 'help');
                  }
                }}
              >
                <span className="contact-mode-tag support">Support</span>
                <h2>Wants Some Help</h2>
                <p>{helpContact ? `Chat directly with ${helpContact.username} from a BookBazaar trusted supporter.` : 'One of our trusted BookBazaar Supporter will appear here when available.'}</p>
              </button>
              <button
                className={`contact-mode-card ${activeCategory === 'users' ? 'active' : ''}`}
                onClick={() => setActiveCategory('users')}
              >
                <span className="contact-mode-tag">Community</span>
                <h2>Connect with other users</h2>
                <p>Talk with verified readers and build your own reading circle.</p>
              </button>
            </div>

            <div className="contact-section">
              {activeCategory === 'help' ? (
                <>
                  <div className="contact-section-head">
                    <h3>Supporter help</h3>
                    <p>Direct support</p>
                  </div>
                  <div className="chat-list contact-list-scroll">
                    {!helpContact && <p className="chat-empty">No any supporter is available right now.</p>}
                    {helpContact && (
                      <button
                        className={`chat-list-item ${activeUser?.id === helpContact.id ? 'active' : ''}`}
                        onClick={() => handleSelectUser(helpContact, 'help')}
                      >
                        <div>
                          <strong>{helpContact.username}</strong>
                        </div>
                        <p>
                          {helpConversation
                            ? helpConversation.lastMessageText || 'Open help conversation'
                            : 'Start a help conversation with BookBazaar Supporter'}
                        </p>
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="contact-section-head">
                    <h3>Connect with other users</h3>
                  </div>
                  <input
                    type="text"
                    className="chat-search"
                    placeholder="Search by username or email"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <div className="chat-list contact-list-scroll">
                    {visibleUsers.length === 0 && <p className="chat-empty">No users matched your search.</p>}
                    {visibleUsers.map((listedUser) => {
                      const existingConversation = conversationByUserId[listedUser.id];

                      return (
                        <button
                          key={listedUser.id}
                          className={`chat-list-item ${activeUser?.id === listedUser.id ? 'active' : ''}`}
                          onClick={() => handleSelectUser(listedUser, 'users')}
                        >
                          <div>
                            <strong>{listedUser.username}</strong>
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
                </>
              )}
            </div>
          </aside>

          <section className="chat-panel contact-chat-panel">
            <div className="chat-panel-header contact-panel-header">
              <div>
                <span className="contact-active-tag">
                  {activeCategory === 'help' ? 'Supporter help' : 'User chat'}
                </span>
                <h2>{activeUser ? activeUser.username : 'Select a contact option'}</h2>
                <p>
                  {activeUser
                    ? activeCategory === 'help'
                      ? `You are chatting with a trusted BookBazaar supporter `
                      : `Chatting with  ${activeUser.username}`
                    : 'Pick a reader or open Wants Some Help to begin.'}
                </p>
              </div>
            </div>

            {error && <div className="chat-error">{error}</div>}

            <div className="chat-messages contact-messages">
              {!activeUser && (
                <div className="chat-placeholder">
                  <h3>Contact hub ready</h3>
                  <p>Choose someone from the left, or open the AI assistant at the bottom-right.</p>
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
                    <div key={message.id} className={`chat-bubble ${isOwnMessage ? 'own' : 'other'}`}>
                      <span className="chat-author">{isOwnMessage ? 'You' : message.sender.username}</span>
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
                  <p>
                    {activeCategory === 'help'
                      ? 'No help messages yet. Tell admin what you need.'
                      : 'No messages yet. Say hello to start the conversation.'}
                  </p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-composer" onSubmit={handleSendMessage}>
              <textarea
                placeholder={
                  activeUser
                    ? activeCategory === 'help'
                      ? 'Describe your issue or ask for support...'
                      : 'Type your message...'
                    : 'Select a contact option to start chatting'
                }
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                disabled={!activeUser || sending}
                rows={3}
              />
              <button type="submit" disabled={!activeUser || sending || !messageText.trim()}>
                {sending ? 'Sending...' : activeCategory === 'help' ? 'Ask Supporter' : 'Send'}
              </button>
            </form>
          </section>
        </div>
      </div>

      <div className="floating-assistant">
        {assistantOpen && (
          <div className="assistant-widget-window">
            <div className="assistant-widget-header">
              <div className="assistant-widget-brand">
                <img src={botAvatar} alt="AI assistant" className="assistant-widget-avatar" />
                <div>
                  <strong>BookBazaar AI</strong>
                  <span>Website helper</span>
                </div>
              </div>
              <button
                type="button"
                className="assistant-close-btn"
                onClick={() => setAssistantOpen(false)}
                aria-label="Close assistant"
              >
                x
              </button>
            </div>

            <div className="assistant-widget-body">
              {assistantError && <div className="chat-error">{assistantError}</div>}

              {assistantMessages.map((message) => (
                <div
                  key={message.id}
                  className={`assistant-widget-bubble ${message.role === 'user' ? 'user' : 'assistant'}`}
                >
                  {message.text}
                </div>
              ))}

              {assistantSending && (
                <div className="assistant-widget-bubble assistant">
                  Thinking...
                </div>
              )}

              <div className="assistant-quick-actions">
                <button type="button" disabled={assistantSending} onClick={() => openAssistantWithPrompt('How do I order a book?')}>
                  Order a book
                </button>
                <button type="button" disabled={assistantSending} onClick={() => openAssistantWithPrompt('Where can I view all books?')}>
                  View all books
                </button>
                <button type="button" disabled={assistantSending} onClick={() => openAssistantWithPrompt('How do I edit address?')}>
                  Edit address
                </button>
                <button type="button" disabled={assistantSending} onClick={() => openAssistantWithPrompt('How do I contact admin?')}>
                  Contact Supporter
                </button>
              </div>
              <div ref={assistantEndRef} />
            </div>

            <form className="assistant-widget-composer" onSubmit={handleAssistantSend}>
              <textarea
                rows={2}
                placeholder="Ask about BookBazaar features..."
                value={assistantInput}
                onChange={(e) => setAssistantInput(e.target.value)}
                disabled={assistantSending}
              />
              <button type="submit" disabled={assistantSending || !assistantInput.trim()}>
                {assistantSending ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        )}

        <button
          type="button"
          className="assistant-floating-trigger"
          onClick={() => setAssistantOpen((current) => !current)}
          aria-label="Open AI assistant"
        >
          <img src={botAvatar} alt="Assistant bot" />
          <span className="assistant-trigger-badge">AI</span>
        </button>
      </div>
    </div>
  );
};

export default ChatPage;
