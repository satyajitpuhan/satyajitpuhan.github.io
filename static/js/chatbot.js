// ============================================================
// SatyaBot — AI Chatbot Engine for Satyajit Puhan's Website
// Client-side keyword matching against CHATBOT_KNOWLEDGE
// ============================================================

(function () {
  "use strict";

  // ── Configuration ─────────────────────────────────────────
  const BOT_NAME = "SatyaBot";
  const BOT_TAGLINE = "Explore. Learn. Connect with Satyajit.";
  const WELCOME_MSG = `Welcome to Satyajit Puhan's official website. I am <b>SatyaBot</b>, your virtual guide. How may I assist you today?`;
  const FALLBACK_MSG = `I'm not sure I have information on that. Try asking about:<br>• Research areas (TMDs, GPDs, mesons)<br>• Publications & papers<br>• Education & career<br>• Skills & tools<br>• Contact information<br><br>Or click one of the quick-reply buttons below! 💡`;
  const TYPING_DELAY = 600;

  // ── Inject HTML ───────────────────────────────────────────
  function createChatbotHTML() {
    const html = `
    <div id="satyabot-tooltip" class="satyabot-tooltip">
      <span>👋 Hello! Can I help you?</span>
    </div>
    <button id="satyabot-toggle" class="satyabot-toggle" aria-label="Open chat assistant">
      <svg class="satyabot-icon-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
      </svg>
      <svg class="satyabot-icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>

    <div id="satyabot-panel" class="satyabot-panel">
      <div class="satyabot-header">
        <div class="satyabot-header-info">
          <div class="satyabot-avatar">
            <img src="/images/about/me.jpg" alt="Satyajit Puhan" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />
          </div>
          <div>
            <div class="satyabot-header-name">${BOT_NAME}</div>
            <div class="satyabot-header-tagline">${BOT_TAGLINE}</div>
          </div>
        </div>
        <button id="satyabot-home" class="satyabot-home-btn" title="Reset conversation">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1"/>
          </svg>
        </button>
      </div>

      <div id="satyabot-messages" class="satyabot-messages"></div>

      <div class="satyabot-disclaimer">
        ⚠️ Knowledge-based responses. Navigate the website for complete details.
      </div>

      <div class="satyabot-input-area">
        <input id="satyabot-input" type="text" placeholder="Ask me about Satyajit..." autocomplete="off" />
        <button id="satyabot-send" aria-label="Send message">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>`;

    const container = document.createElement("div");
    container.id = "satyabot-container";
    container.innerHTML = html;
    document.body.appendChild(container);
  }

  // ── DOM References ─────────────────────────────────────────
  let toggle, panel, messagesDiv, input, sendBtn, tooltip, homeBtn;

  function cacheDom() {
    toggle = document.getElementById("satyabot-toggle");
    panel = document.getElementById("satyabot-panel");
    messagesDiv = document.getElementById("satyabot-messages");
    input = document.getElementById("satyabot-input");
    sendBtn = document.getElementById("satyabot-send");
    tooltip = document.getElementById("satyabot-tooltip");
    homeBtn = document.getElementById("satyabot-home");
  }

  // ── State ──────────────────────────────────────────────────
  let isOpen = false;

  // ── Toggle Chat ────────────────────────────────────────────
  function openChat() {
    isOpen = true;
    panel.classList.add("open");
    toggle.classList.add("active");
    tooltip.classList.remove("show");
    input.focus();
  }

  function closeChat() {
    isOpen = false;
    panel.classList.remove("open");
    toggle.classList.remove("active");
  }

  function toggleChat() {
    if (isOpen) closeChat();
    else openChat();
  }

  // ── Message Rendering ──────────────────────────────────────
  function addMessage(html, sender) {
    const bubble = document.createElement("div");
    bubble.className = `satyabot-msg satyabot-msg-${sender}`;
    bubble.innerHTML = html;
    messagesDiv.appendChild(bubble);
    scrollToBottom();
  }

  function addQuickReplies() {
    const container = document.createElement("div");
    container.className = "satyabot-quick-replies";
    CHATBOT_KNOWLEDGE.quickReplies.forEach((qr) => {
      const btn = document.createElement("button");
      btn.className = "satyabot-qr-btn";
      btn.textContent = qr.label;
      btn.addEventListener("click", () => handleUserInput(qr.query));
      container.appendChild(btn);
    });
    messagesDiv.appendChild(container);
    scrollToBottom();
  }

  function showTyping() {
    const typing = document.createElement("div");
    typing.className = "satyabot-msg satyabot-msg-bot satyabot-typing";
    typing.id = "satyabot-typing-indicator";
    typing.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
    messagesDiv.appendChild(typing);
    scrollToBottom();
  }

  function removeTyping() {
    const el = document.getElementById("satyabot-typing-indicator");
    if (el) el.remove();
  }

  function scrollToBottom() {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  // ── Matching Engine ────────────────────────────────────────
  function normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenize(text) {
    const stopWords = new Set([
      "a", "an", "the", "is", "are", "was", "were", "do", "does", "did",
      "can", "could", "will", "would", "should", "may", "might",
      "i", "me", "my", "you", "your", "he", "his", "she", "her", "it", "its",
      "we", "us", "our", "they", "them", "their",
      "in", "on", "at", "to", "for", "of", "with", "by", "from", "about",
      "and", "or", "but", "not", "no", "so", "if", "then", "than",
      "what", "which", "who", "how", "when", "where",
      "have", "has", "had", "be", "been", "being",
      "this", "that", "these", "those",
      "just", "very", "really", "also", "too", "more",
      "tell", "show", "give", "please", "know", "want"
    ]);
    return normalizeText(text)
      .split(" ")
      .filter((w) => w.length > 1 && !stopWords.has(w));
  }

  function scoreEntry(entry, userTokens, rawQuery) {
    let score = 0;
    const normalizedQuery = normalizeText(rawQuery);

    // Exact phrase match in keywords (highest weight)
    for (const kw of entry.keywords) {
      if (normalizedQuery.includes(kw)) {
        score += 10;
      }
    }

    // Token overlap with keywords
    for (const token of userTokens) {
      for (const kw of entry.keywords) {
        // Exact token match
        if (kw === token) {
          score += 5;
        }
        // Keyword contains token
        else if (kw.includes(token) || token.includes(kw)) {
          score += 3;
        }
        // Fuzzy match (Levenshtein)
        else if (token.length > 3 && levenshtein(token, kw) <= 2) {
          score += 2;
        }
      }
    }

    return score;
  }

  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + (a[i - 1] !== b[j - 1] ? 1 : 0)
        );
      }
    }
    return dp[m][n];
  }

  function findBestAnswer(rawQuery) {
    const tokens = tokenize(rawQuery);
    if (tokens.length === 0) return null;

    let bestScore = 0;
    let bestEntry = null;

    for (const entry of CHATBOT_KNOWLEDGE.entries) {
      const score = scoreEntry(entry, tokens, rawQuery);
      if (score > bestScore) {
        bestScore = score;
        bestEntry = entry;
      }
    }

    return bestScore >= 3 ? bestEntry : null;
  }

  // ── Greeting Detection ─────────────────────────────────────
  function isGreeting(text) {
    const greetings = [
      "hi", "hello", "hey", "hola", "namaste", "howdy",
      "good morning", "good afternoon", "good evening",
      "greetings", "sup", "yo", "hii", "hiii", "hellow",
      "namaskar", "namaskara"
    ];
    const normalized = normalizeText(text);
    return greetings.some((g) => normalized === g || normalized.startsWith(g + " "));
  }

  function isThankYou(text) {
    const thanks = ["thank", "thanks", "thank you", "thx", "ty", "dhanyawaad", "dhanyawad"];
    const normalized = normalizeText(text);
    return thanks.some((t) => {
      // Must match exactly or be surrounded by space/boundaries
      const regex = new RegExp(`(^|\\s)${t}($|\\s)`);
      return regex.test(normalized);
    });
  }

  // ── Handle User Input ──────────────────────────────────────
  function handleUserInput(query) {
    if (!query || !query.trim()) return;

    addMessage(query, "user");
    input.value = "";

    showTyping();

    setTimeout(() => {
      removeTyping();

      if (isGreeting(query)) {
        addMessage(
          `Hello! 👋 I'm <b>${BOT_NAME}</b>. How can I help you today? Feel free to ask about Satyajit's research, publications, education, or anything else!`,
          "bot"
        );
        addQuickReplies();
        return;
      }

      if (isThankYou(query)) {
        addMessage(`You're welcome! 😊 Feel free to ask anything else about Satyajit. I'm here to help!`, "bot");
        return;
      }

      const entry = findBestAnswer(query);
      if (entry) {
        addMessage(entry.answer, "bot");
        if (entry.section) {
          const navBtn = document.createElement("div");
          navBtn.className = "satyabot-nav-link";
          navBtn.innerHTML = `<a href="${entry.section}">📍 Navigate to this section →</a>`;
          messagesDiv.appendChild(navBtn);
        }
      } else {
        addMessage(FALLBACK_MSG, "bot");
      }

      addQuickReplies();
    }, TYPING_DELAY);
  }

  // ── Reset Conversation ─────────────────────────────────────
  function resetConversation() {
    messagesDiv.innerHTML = "";
    addMessage(WELCOME_MSG, "bot");
    addQuickReplies();
  }

  // ── Tooltip ────────────────────────────────────────────────
  function showTooltip() {
    if (!isOpen) {
      tooltip.classList.add("show");
      setTimeout(() => {
        if (!isOpen) tooltip.classList.remove("show");
      }, 5000);
    }
  }

  // ── Initialize ─────────────────────────────────────────────
  function init() {
    createChatbotHTML();
    cacheDom();

    // Event listeners
    toggle.addEventListener("click", toggleChat);
    sendBtn.addEventListener("click", () => handleUserInput(input.value));
    homeBtn.addEventListener("click", resetConversation);

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleUserInput(input.value);
    });

    // Show welcome
    addMessage(WELCOME_MSG, "bot");
    addQuickReplies();

    // Show tooltip after 3 seconds
    setTimeout(showTooltip, 3000);

    // Close on outside click
    document.addEventListener("click", (e) => {
      if (
        isOpen &&
        !panel.contains(e.target) &&
        !toggle.contains(e.target) &&
        !tooltip.contains(e.target)
      ) {
        closeChat();
      }
    });
  }

  // Start when DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
