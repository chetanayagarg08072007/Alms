// ==========================================
// ALMS AI & VOICE ASSISTANT
// ==========================================

class ALMSVoiceBot {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.isSpeechEnabled = true;
    this.currentDonationDraft = null;
    this.initSpeech();
    this.renderWidget();
    this.bindEvents();
  }

  initSpeech() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = "en-IN";

      this.recognition.onstart = () => {
        this.isListening = true;
        this.updateMicUI(true);
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.handleUserInput(transcript);
      };

      this.recognition.onerror = (event) => {
        console.warn("Speech recognition notice:", event.error);
        this.isListening = false;
        this.updateMicUI(false);
        if (event.error === "not-allowed") {
          showToast("Microphone access was denied. You can type in the chat instead.", "error");
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.updateMicUI(false);
      };
    }
  }

  speak(text) {
    if (!this.isSpeechEnabled || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[✓🔥🍱🚚🎉🌟📦•]/g, "");
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = "en-IN";
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  }

  toggleListening() {
    if (!this.recognition) {
      showToast("Speech recognition is not supported in this browser. Please type your message.", "warning");
      return;
    }
    if (this.isListening) {
      this.recognition.stop();
    } else {
      try {
        this.recognition.start();
      } catch (e) {
        this.recognition.stop();
      }
    }
  }

  renderWidget() {
    // Inject floating voice button & chat modal
    const widgetHTML = `
      <div id="voiceBotContainer">
        <!-- Floating Trigger Button -->
        <button id="voiceBotTrigger" aria-label="Open AI Voice Assistant" title="Talk to ALMS Voice Assistant">
          <span class="bot-icon">🎙️</span>
          <span class="pulse-ring"></span>
          <span class="btn-label">AI Voice Assistant</span>
        </button>

        <!-- Voice Chat Drawer Modal -->
        <div id="voiceBotDrawer" class="voice-drawer hidden">
          <div class="voice-drawer-header">
            <div class="bot-avatar-wrap">
              <div class="bot-avatar">🤖</div>
              <div>
                <h4>ALMS Voice Assistant</h4>
                <p class="status-online"><span class="dot-online"></span> Smart Food Rescue AI</p>
              </div>
            </div>
            <div class="drawer-actions">
              <button id="voiceMuteToggle" title="Toggle Speech Voice" class="icon-btn">🔊</button>
              <button id="voiceDrawerClose" title="Close" class="icon-btn">✕</button>
            </div>
          </div>

          <div class="voice-messages" id="voiceMessages">
            <div class="msg bot">
              <div class="msg-bubble">
                👋 Hello! I am your ALMS Rescue Assistant. You can speak or type to donate surplus food, track urgent relief, or check community stats.
              </div>
            </div>
          </div>

          <!-- Structured Donation Draft Preview (Embedded inside Assistant) -->
          <div id="voiceDonationPreview" class="donation-preview-card hidden"></div>

          <!-- Quick Suggestion Chips -->
          <div class="quick-chips">
            <button class="chip" data-prompt="I want to donate 50 meals of cooked food at Green Park">🍱 Donate 50 meals</button>
            <button class="chip" data-prompt="Show urgent hunger requests">🔥 Urgent alerts</button>
            <button class="chip" data-prompt="How many meals have we rescued so far?">📊 Impact stats</button>
            <button class="chip" data-prompt="How does the community pool work?">🤝 Community pool</button>
          </div>

          <!-- Input Bar -->
          <form id="voiceInputForm" class="voice-input-row">
            <button type="button" id="voiceMicBtn" class="mic-btn" title="Click to Speak">
              🎙️
            </button>
            <input type="text" id="voiceTextInput" placeholder="Speak or type (e.g. Donate 30 meals)..." autocomplete="off">
            <button type="submit" class="send-btn" title="Send Message">➔</button>
          </form>
        </div>
      </div>
    `;

    const div = document.createElement("div");
    div.innerHTML = widgetHTML;
    document.body.appendChild(div.firstElementChild);
  }

  updateMicUI(listening) {
    const micBtn = document.querySelector("#voiceMicBtn");
    const triggerBtn = document.querySelector("#voiceBotTrigger");
    if (micBtn) {
      micBtn.classList.toggle("listening", listening);
      micBtn.innerHTML = listening ? "⏹️" : "🎙️";
    }
    if (triggerBtn) {
      triggerBtn.classList.toggle("listening", listening);
    }
  }

  bindEvents() {
    const trigger = document.querySelector("#voiceBotTrigger");
    const drawer = document.querySelector("#voiceBotDrawer");
    const closeBtn = document.querySelector("#voiceDrawerClose");
    const micBtn = document.querySelector("#voiceMicBtn");
    const form = document.querySelector("#voiceInputForm");
    const input = document.querySelector("#voiceTextInput");
    const muteBtn = document.querySelector("#voiceMuteToggle");

    trigger?.addEventListener("click", () => {
      drawer.classList.toggle("hidden");
      if (!drawer.classList.contains("hidden")) {
        input.focus();
      }
    });

    closeBtn?.addEventListener("click", () => {
      drawer.classList.add("hidden");
      if (this.isListening && this.recognition) {
        this.recognition.stop();
      }
      window.speechSynthesis?.cancel();
    });

    micBtn?.addEventListener("click", () => this.toggleListening());

    muteBtn?.addEventListener("click", () => {
      this.isSpeechEnabled = !this.isSpeechEnabled;
      muteBtn.textContent = this.isSpeechEnabled ? "🔊" : "🔇";
      if (!this.isSpeechEnabled) window.speechSynthesis?.cancel();
    });

    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = "";
      this.handleUserInput(text);
    });

    document.querySelectorAll(".quick-chips .chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const prompt = chip.dataset.prompt;
        this.handleUserInput(prompt);
      });
    });
  }

  appendMessage(text, sender = "bot") {
    const container = document.querySelector("#voiceMessages");
    if (!container) return;
    const div = document.createElement("div");
    div.className = `msg ${sender}`;
    div.innerHTML = `<div class="msg-bubble">${text}</div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  async handleUserInput(text) {
    this.appendMessage(text, "user");
    const isDonationIntent = /donate|donating|meals|feed|plates|surplus|kg of/i.test(text);

    if (isDonationIntent) {
      try {
        const res = await api("/api/ai/parse-donation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text })
        });

        this.appendMessage(res.reply, "bot");
        this.speak(res.reply);

        if (res.structured && res.structured.people_to_feed) {
          this.renderDonationPreview(res.structured);
        }
      } catch (err) {
        this.appendMessage("Sorry, I had trouble parsing that. Please try typing the donation details.", "bot");
      }
    } else {
      try {
        const res = await api("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text })
        });

        this.appendMessage(res.reply, "bot");
        this.speak(res.reply);

        if (res.action) {
          this.handleAssistantAction(res.action);
        }
      } catch (err) {
        this.appendMessage("I couldn't process your request right now. Please try again.", "bot");
      }
    }
  }

  renderDonationPreview(data) {
    const previewEl = document.querySelector("#voiceDonationPreview");
    if (!previewEl) return;

    this.currentDonationDraft = data;
    previewEl.innerHTML = `
      <div class="draft-header">
        <strong>📋 AI Structured Donation</strong>
        <span class="badge ${data.urgency === 'URGENT' ? 'danger' : 'success'}">${data.urgency}</span>
      </div>
      <div class="draft-body">
        <div><b>Food:</b> ${data.food_name || data.food_type}</div>
        <div><b>Quantity / Meals:</b> ${data.people_to_feed} people (${data.dietary})</div>
        <div><b>Pickup:</b> ${data.pickup_location || 'Pending location...'}</div>
        <div><b>Shelf Life:</b> ${data.expiry_hours} hours</div>
      </div>
      <div class="draft-actions">
        <button id="voiceConfirmDonation" class="btn btn-primary btn-sm">✓ Confirm & Post to Rescue Network</button>
        <button id="voiceCancelDraft" class="btn btn-ghost btn-sm">Discard</button>
      </div>
    `;
    previewEl.classList.remove("hidden");

    document.querySelector("#voiceConfirmDonation")?.addEventListener("click", async () => {
      if (!data.pickup_location) {
        const loc = prompt("Please enter the pickup location / landmark:", "Safdarjung Enclave");
        if (!loc) return;
        data.pickup_location = loc;
      }
      try {
        const submitBtn = document.querySelector("#voiceConfirmDonation");
        submitBtn.disabled = true;
        submitBtn.textContent = "Posting donation...";

        const res = await api("/api/donations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });

        previewEl.classList.add("hidden");
        this.appendMessage(`🎉 Awesome! Your donation (#${res.id}) of ${data.people_to_feed} meals has been posted! Pickup Verification Code is <b>${res.pickup_code}</b>. Nearby NGOs are being matched right now.`, "bot");
        this.speak(`Your donation of ${data.people_to_feed} meals has been posted successfully!`);
        showToast("✓ Food donation created successfully!", "success");

        if (typeof loadStats === "function") loadStats();
        if (typeof loadWorkflowFeed === "function") loadWorkflowFeed();
      } catch (err) {
        showToast(err.message, "error");
        this.appendMessage(`Failed to create donation: ${err.message}`, "bot");
      }
    });

    document.querySelector("#voiceCancelDraft")?.addEventListener("click", () => {
      previewEl.classList.add("hidden");
      this.currentDonationDraft = null;
    });
  }

  handleAssistantAction(action) {
    if (action.type === "open_donate") {
      document.querySelector("#donate")?.scrollIntoView({ behavior: "smooth" });
    } else if (action.type === "scroll_impact") {
      document.querySelector("#impact")?.scrollIntoView({ behavior: "smooth" });
    } else if (action.type === "navigate_volunteer") {
      window.location.href = "registration.html?role=volunteer";
    } else if (action.type === "navigate_pool") {
      window.location.href = "pool.html";
    }
  }
}

// Initialize Voice Bot when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.almsVoiceBot = new ALMSVoiceBot();
});
