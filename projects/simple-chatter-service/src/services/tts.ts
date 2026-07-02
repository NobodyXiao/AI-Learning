import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

/**
 * 语音合成服务，使用 macOS 系统内置 `say` 命令 + afconvert。
 * macOS 内置的 Tingting（婷婷）中文语音质量远好于浏览器 TTS。
 * 纯离线运行，无需任何 API Key。
 */
export async function synthesize(text: string): Promise<Buffer> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tts-'));
  const id = crypto.randomUUID();
  const aiffFile = path.join(tmpDir, `${id}.aiff`);
  const wavFile = path.join(tmpDir, `${id}.wav`);

  try {
    execSync(`say -v Tingting -o "${aiffFile}" "${text.replace(/"/g, '\\"')}"`, {
      timeout: 30000,
    });

    // Convert to WAV for browser compatibility (afconvert is built into macOS)
    execSync(`afconvert -f WAVE -d LEI16 "${aiffFile}" "${wavFile}" 2>/dev/null`, {
      timeout: 30000,
    });

    return fs.readFileSync(wavFile);
  } finally {
    try { fs.unlinkSync(aiffFile); } catch {}
    try { fs.unlinkSync(wavFile); } catch {}
    try { fs.rmdirSync(tmpDir); } catch {}
  }
}
