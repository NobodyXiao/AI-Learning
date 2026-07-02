import { useState, useRef, useCallback } from "react";
import { Input, Button, App, Segmented } from "antd";
import { SendOutlined, AudioOutlined } from "@ant-design/icons";
import { createModel, Model } from "vosk-browser";

const { TextArea } = Input;

const LANGUAGES: Record<string, { modelUrl: string; label: string }> = {
  zh: {
    modelUrl: "/models/vosk-model-small-cn-0.22.zip",
    label: "中文",
  },
  en: {
    modelUrl: "/models/vosk-model-small-en-us-0.15.zip",
    label: "English",
  },
};

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [value, setValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [lang, setLang] = useState("zh");
  const modelsRef = useRef<Record<string, Model | null>>({});
  const recognizerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const { notification } = App.useApp();

  const stopRecording = useCallback(() => {
    processorRef.current?.disconnect();
    processorRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recognizerRef.current?.remove();
    recognizerRef.current = null;
    setIsRecording(false);
  }, []);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoice = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    const langConfig = LANGUAGES[lang];
    setIsLoadingModel(true);

    try {
      // 加载当前语言的模型（首次使用时缓存）
      if (!modelsRef.current[lang]) {
        const model = await createModel(langConfig.modelUrl);
        modelsRef.current[lang] = model;
      }

      // 请求麦克风
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 创建 AudioContext（16kHz 匹配模型）
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      // 创建 Vosk 识别器
      const model = modelsRef.current[lang]!;
      const KaldiRec = model.KaldiRecognizer;
      const recognizer = new KaldiRec(16000);
      recognizer.setWords(false);

      recognizer.on("result", (msg: any) => {
        if (msg.result?.text) {
          setValue((prev) => prev + (prev ? " " : "") + msg.result.text);
        }
      });

      recognizerRef.current = recognizer;

      // ScriptProcessorNode 处理音频
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(audioContext.destination);

      processor.onaudioprocess = (e) => {
        recognizer.acceptWaveform(e.inputBuffer);
      };

      setIsRecording(true);
    } catch (err: any) {
      console.error("[Vosk] error:", err);

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        notification.error({
          title: "麦克风权限被拒绝",
          description: "请在浏览器设置中允许麦克风访问",
          placement: "topRight",
          duration: 4,
        });
      } else {
        notification.error({
          title: "语音识别启动失败",
          description: err.message || "请刷新页面重试",
          placement: "topRight",
          duration: 4,
        });
      }
    } finally {
      setIsLoadingModel(false);
    }
  };

  const recordDisabled = disabled || isLoadingModel;

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        padding: "12px 24px 24px",
        borderTop: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <TextArea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          isLoadingModel
            ? `正在加载${LANGUAGES[lang].label}语音模型...`
            : isRecording
              ? "正在录音..."
              : "Type a message..."
        }
        autoSize={{ minRows: 1, maxRows: 4 }}
        disabled={disabled}
        aria-label="Message input"
      />
      <Segmented
        options={[
          { value: "zh", label: "中" },
          { value: "en", label: "EN" },
        ]}
        value={lang}
        onChange={(v) => setLang(v as string)}
        size="small"
        disabled={isRecording}
        style={{ alignSelf: "center" }}
      />
      <Button
        type={isRecording ? "primary" : "default"}
        danger={isRecording}
        icon={<AudioOutlined />}
        onClick={toggleVoice}
        disabled={recordDisabled}
        loading={isLoadingModel}
        aria-label={isRecording ? "Stop recording" : "Voice input"}
      />
      <Button
        type="primary"
        icon={<SendOutlined />}
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
      />
    </div>
  );
};
