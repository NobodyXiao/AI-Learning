import { useEffect, useState, useCallback, useRef } from "react";
import { Typography, Button } from "antd";
import { RobotOutlined, UserOutlined, SoundOutlined } from "@ant-design/icons";
import type { Message } from "types/chat";

const { Text } = Typography;

interface ChatMessageProps {
  message: Message;
  autoSpeak?: boolean;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

let voicesLoaded = false;
let pendingVoices: SpeechSynthesisVoice[] = [];

function stripEmojis(text: string): string {
  return text
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, "")
    .replace(/[☀-➿]/gu, "")
    .replace(/[\u{2700}-\u{27BF}]/gu, "")
    .replace(/[︀-️]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function findBestVoice(text: string): SpeechSynthesisVoice | null {
  const voices = pendingVoices;
  if (!voices.length) return null;

  const isChinese = /[一-鿿]/.test(text);

  if (isChinese) {
    // macOS: Ting-Ting is the most natural Mandarin voice
    return (
      voices.find((v) => v.name === "Ting-Ting") ||
      voices.find((v) => v.lang.startsWith("zh") && v.name.includes("Ting-Ting")) ||
      voices.find((v) => v.lang.startsWith("zh") && v.localService) ||
      voices.find((v) => v.lang.startsWith("zh"))
    ) || null;
  }

  // English: prefer premium / enhanced neural voices, then Samantha
  return (
    voices.find((v) => v.lang.startsWith("en") && /premium|enhanced|neural/i.test(v.name)) ||
    voices.find((v) => v.lang.startsWith("en") && v.name === "Samantha") ||
    voices.find((v) => v.lang.startsWith("en") && v.name === "Alex") ||
    voices.find((v) => v.lang.startsWith("en") && v.localService) ||
    voices.find((v) => v.lang.startsWith("en"))
  ) || null;
}

function ensureVoices(): Promise<SpeechSynthesisVoice[]> {
  if (voicesLoaded) return Promise.resolve(pendingVoices);
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length) {
      voicesLoaded = true;
      pendingVoices = voices;
      resolve(voices);
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        voicesLoaded = true;
        pendingVoices = window.speechSynthesis.getVoices();
        resolve(pendingVoices);
      };
    }
  });
}

function speakText(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;

  window.speechSynthesis.cancel();

  const clean = stripEmojis(text);
  if (!clean) return false;

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = 0.92;
  utterance.pitch = 1.0;

  const voice = findBestVoice(clean);
  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
  return true;
}

function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, autoSpeak }) => {
  const [mounted, setMounted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const hasSpokenRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    ensureVoices();
  }, []);

  // Auto-speak when streaming finishes
  useEffect(() => {
    if (
      autoSpeak &&
      !hasSpokenRef.current &&
      message.role === "assistant" &&
      message.content.length > 20
    ) {
      hasSpokenRef.current = true;
      const timer = setTimeout(async () => {
        await ensureVoices();
        speakText(message.content);
        setIsSpeaking(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [autoSpeak, message.content, message.role]);

  // Stop speaking when component unmounts or user sends new message
  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  const isUser = message.role === "user";

  const handleSpeak = useCallback(() => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      speakText(message.content);
      setIsSpeaking(true);
    }
  }, [isSpeaking, message.content]);

  return (
    <div className={`message-row ${message.role}`}>
      <div
        style={{
          display: "flex",
          gap: 8,
          flexDirection: isUser ? "row-reverse" : "row",
          alignItems: "flex-end",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: isUser ? "#1677ff" : "#f0f0f0",
            flexShrink: 0,
          }}
        >
          {isUser ? (
            <UserOutlined style={{ color: "#fff", fontSize: 14 }} />
          ) : (
            <RobotOutlined style={{ color: "#1677ff", fontSize: 14 }} />
          )}
        </div>
        <div>
          <div className={`message-bubble ${message.role}`}>
            <Text style={{ color: isUser ? "#fff" : undefined }}>
              {message.content}
            </Text>
          </div>
          <div className="message-time">
            {!isUser && message.content && (
              <Button
                type="text"
                size="small"
                icon={<SoundOutlined />}
                onClick={handleSpeak}
                style={{
                  fontSize: 11,
                  width: 20,
                  height: 20,
                  marginRight: 4,
                  color: isSpeaking ? "#1677ff" : undefined,
                  opacity: isSpeaking ? 1 : 0.5,
                }}
                aria-label={isSpeaking ? "Stop" : "Read aloud"}
              />
            )}
            <Text type="secondary" style={{ fontSize: 11 }}>
              {mounted ? formatTime(message.timestamp) : ""}
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};
