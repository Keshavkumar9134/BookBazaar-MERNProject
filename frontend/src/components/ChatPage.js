import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import './ChatPage.css';
import { AuthContext } from '../context/AuthContext';
import API_BASE_URL, { apiUrl } from '../api';

const botAvatar = 'https://cdn-icons-png.flaticon.com/512/4712/4712109.png';

const buildAssistantReply = (input) => {
  const text = input.toLowerCase().trim();

  if (
    text.includes('website name') ||
    text.includes('title name') ||
    text.includes('site name') ||
    text.includes('what is this website')
  ) {
    return 'This website is BookBazaar. You can browse books, add them to cart, place orders, view order history, contact other users, and chat with admin support from the Contact page.';
  }

  if (
    text.includes('how to order') ||
    text.includes('order a book') ||
    text.includes('buy a book') ||
    text.includes('place order')
  ) {
    return 'To order a book: open Shop, choose a book, add it to Cart, open Cart, click Proceed to Checkout, save your delivery address, confirm the order, choose a payment method, and then click Pay & Place Order.';
  }

  if (
    text.includes('view all books') ||
    text.includes('see all books') ||
    text.includes('where are books') ||
    text.includes('shop page') ||
    text.includes('browse books')
  ) {
    return 'You can view all books from the Shop page. Use the top navigation and click Shop. From Home, some featured sections also take you directly to filtered book lists.';
  }

  if (
    text.includes('cart') ||
    text.includes('add to cart') ||
    text.includes('my cart')
  ) {
    return 'You can add books from Shop to your cart. Then open Cart from the top menu to review items, remove items, clear the cart, or move to checkout.';
  }

  if (
    text.includes('checkout') ||
    text.includes('payment') ||
    text.includes('cash on delivery') ||
    text.includes('online payment')
  ) {
    return 'At checkout, first save your delivery address, then confirm your order, then choose a payment method. The available methods are Cash on Delivery and Online Payment.';
  }

  if (
    text.includes('address') ||
    text.includes('edit address') ||
    text.includes('change address') ||
    text.includes('delivery address')
  ) {
    return 'You can manage the address from the Checkout page. If no address is saved, enter it manually or use your current location, then click Save Address. If an address is already saved, click Edit Address to change it and save again.';
  }

  if (
    text.includes('current location') ||
    text.includes('use my location') ||
    text.includes('location')
  ) {
    return 'On the Checkout page, Use My Current Location captures your browser location and shows the detected place. You can save either your manually typed address or the detected location-based address.';
  }

  if (
    text.includes('order history') ||
    text.includes('my orders') ||
    text.includes('orders page') ||
    text.includes('view orders')
  ) {
    return 'You can view your placed orders from the Orders page in the top navigation. There you can see your saved address, payment method, and ordered books.';
  }

  if (
    text.includes('contact admin') ||
    text.includes('admin help') ||
    text.includes('support') ||
    text.includes('wants some help')
  ) {
    return 'To contact with our BookBazaar supports, open Contact and choose Wants Some Help. That opens a direct support conversation with a supporter if support is available.';
  }

  if (
    text.includes('connect with other users') ||
    text.includes('find readers') ||
    text.includes('talk with users') ||
    text.includes('other users')
  ) {
    return 'Use Connect with other users in Contact to chat with verified readers. Admin accounts are excluded from that list.';
  }

  if (
    text.includes('login') ||
    text.includes('sign in') ||
    text.includes('register') ||
    text.includes('sign up')
  ) {
    return 'You can create an account from Register and sign in from Login. After logging in, you can access cart, checkout, orders, and Contact features.';
  }

  if (
    text.includes('sale') ||
    text.includes('new books') ||
    text.includes('newest') ||
    text.includes('genre')
  ) {
    return 'From Home you can jump to books on sale, newest books, or genre-based collections. Shop also supports filtering and browsing different books.';
  }

  if (
    text.includes('about') ||
    text.includes('about us')
  ) {
    return 'You can open About Us from the top navigation to read more about BookBazaar and the website vision.';
  }

  if (
    text.includes('home') ||
    text.includes('homepage')
  ) {
    return 'Use Home in the top navigation to return to the main BookBazaar landing page, where you can jump into Shop, sales, newest books, and genres.';
  }

  if (
  text.includes('cancel order') ||
  text.includes('cancel a ordered book') ||
  text.includes('cancel ordered book') ||
  text.includes('how i cancel a ordered book') ||
  text.includes('cancel my book')
) {
  return 'Right now, BookBazaar does not have a direct cancel-order button for users. You can open Contact, choose "Wants Some Help", and message admin support to request order cancellation.';
}


  return 'I can help with BookBazaar features like Shop, Cart, Checkout, address saving and editing, payment methods, Orders, Contact, user chat, and admin support. Try asking things like: how to order a book, where to view all books, how to edit address, or how to contact admin.';
};

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
  const [assistantMessages, setAssistantMessages] = useState([
    {
      id: 'assistant-welcome',
      role: 'assistant',
      text: 'Hi there. I am your BookBazaar Contact assistant. Ask me how to order a book, where to view all books, how to edit address, how payments work, or how to contact admin.',
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

  const handleAssistantSend = (e) => {
    e.preventDefault();
    const trimmed = assistantInput.trim();
    if (!trimmed) return;

    const timestamp = Date.now();
    const userMessage = {
      id: `user-${timestamp}`,
      role: 'user',
      text: trimmed,
    };

    const assistantMessage = {
      id: `assistant-${timestamp + 1}`,
      role: 'assistant',
      text: buildAssistantReply(trimmed),
    };

    setAssistantMessages((current) => [...current, userMessage, assistantMessage]);
    setAssistantInput('');
  };

  const openAssistantWithPrompt = (prompt) => {
    setAssistantOpen(true);
    if (!prompt) return;

    const timestamp = Date.now();
    const assistantMessage = {
      id: `assistant-${timestamp}`,
      role: 'assistant',
      text: buildAssistantReply(prompt),
    };

    setAssistantMessages((current) => [
      ...current,
      { id: `user-${timestamp - 1}`, role: 'user', text: prompt },
      assistantMessage,
    ]);
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
            <br/>
            <h5>Stay connected with readers, supporter, and your floating AI assistant.</h5>
            {/* <p className="contact-intro">
              Choose who you want to talk to: other users, admin help, or your floating AI assistant.
            </p> */}
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

            {/* <div className="contact-section">
              <div className="contact-section-head">
                <h3>Recent chats</h3>
                <p>Real-time updates</p>
              </div>
              <div className="chat-list contact-list-scroll">
                {conversations.length === 0 && (
                  <p className="chat-empty">No conversations yet. Start one from the contact panels.</p>
                )}
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    className={`chat-list-item ${activeUser?.id === conversation.participant.id ? 'active' : ''}`}
                    onClick={() =>
                      handleSelectUser(
                        conversation.participant,
                        conversation.participant.role === 'admin' ? 'help' : 'users'
                      )
                    }
                  >
                    <div>
                      <strong>{conversation.participant.username}</strong>
                      <span>
                        {conversation.participant.role === 'admin' ? ' (Trusted Supporter)' : ' (User)'}
                      </span>
                    </div>
                    <div className="chat-meta">
                      {conversation.unreadCount > 0 && <span className="chat-badge">{conversation.unreadCount}</span>}
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
            </div> */}

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
                          {/* <span>{helpContact.email}</span> */}
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
                            {/* <span>{listedUser.email}</span> */}
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
                {sending ? 'Sending...' : activeCategory === 'help' ? 'Ask Supported' : 'Send'}
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
              {assistantMessages.map((message) => (
                <div
                  key={message.id}
                  className={`assistant-widget-bubble ${message.role === 'user' ? 'user' : 'assistant'}`}
                >
                  {message.text}
                </div>
              ))}

              <div className="assistant-quick-actions">
                <button type="button" onClick={() => openAssistantWithPrompt('How do I order a book?')}>
                  Order a book
                </button>
                <button type="button" onClick={() => openAssistantWithPrompt('Where can I view all books?')}>
                  View all books
                </button>
                <button type="button" onClick={() => openAssistantWithPrompt('How do I edit address?')}>
                  Edit address
                </button>
                <button type="button" onClick={() => openAssistantWithPrompt('How do I contact admin?')}>
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
              />
              <button type="submit" disabled={!assistantInput.trim()}>
                Send
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
