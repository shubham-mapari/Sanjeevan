"use client";

import {
  ConversationProvider,
  useConversationControls,
  useConversationMode,
  useConversationStatus,
} from "@elevenlabs/react";
import { Sparkles } from "lucide-react";

const voiceAgentId = "agent_7401m3ntphvffsnbywf77g3e8ejv";

export function VoiceAssistantSection() {
  return (
    <ConversationProvider>
      <VoiceAssistantContent />
    </ConversationProvider>
  );
}

function VoiceAssistantContent() {
  const { startSession, endSession } = useConversationControls();
  const { status, message } = useConversationStatus();
  const { isSpeaking, isListening } = useConversationMode();
  const isConnected = status === "connected";
  const isConnecting = status === "connecting";
  const statusLabel =
    status === "error"
      ? `Zoya · ${message || "Connection failed. Tap the orb to try again."}`
      : isConnecting
        ? "Zoya · Connecting"
        : isConnected && isSpeaking
          ? "Zoya · Speaking"
          : isConnected && isListening
            ? "Zoya · Listening"
            : "Zoya · Voice assistant ready";

  function handleOrbClick() {
    if (isConnected) {
      endSession();
      return;
    }

    if (!isConnecting) {
      startSession({ agentId: voiceAgentId, connectionType: "websocket" });
    }
  }

  return (
    <section className="voice-section section-pad" aria-labelledby="voice-title">
      <div className="page-wrap voice-card">
        <div className="voice-orbit">
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <button
            className="voice-orbit-button"
            type="button"
            onClick={handleOrbClick}
            disabled={isConnecting}
            aria-label={
              isConnecting
                ? "Connecting to Zoya"
                : isConnected
                  ? "End conversation with Zoya"
                  : "Start a conversation with Zoya"
            }
            aria-pressed={isConnected}
            title={isConnected ? "End conversation" : "Talk to Zoya"}
          >
            <Sparkles size={23} />
          </button>
        </div>
        <div className="voice-copy">
          <span className="eyebrow">
            <span className="eyebrow-line" /> A new way to explore
          </span>
          <h2 id="voice-title">
            Have a question?
            <br />
            <em>Let&apos;s talk.</em>
          </h2>
          <p>
            Ask Zoya about admissions, courses, campus facilities, or finding
            your way around Sanjeevan. Speak in English, Hindi, or Marathi.
          </p>
          <div
            className={`voice-status voice-status-${status}`}
            role="status"
            aria-live="polite"
          >
            <span className="voice-status-dot" aria-hidden="true" />
            {statusLabel}
          </div>
        </div>
        <div
          className={`voice-wave${isConnected ? " voice-wave-active" : ""}`}
          aria-hidden="true"
        >
          {Array.from({ length: 18 }, (_, index) => (
            <span key={index} />
          ))}
        </div>
      </div>
    </section>
  );
}