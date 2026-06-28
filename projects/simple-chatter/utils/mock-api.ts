const replies: Record<string, string> = {
  hello: 'Hi there! How can I help you today?',
  hi: 'Hello! What brought you here?',
  help: 'Sure! I can help you with:\n- Answering questions\n- Brainstorming ideas\n- Coding assistance\n- General chat',
  name: "I'm Simple Chatter, your AI assistant built with Next.js and Ant Design.",
  weather: 'I wish I could check the weather for you, but I need an API key for that! 😅',
  code: 'Sure! Share your code and I will help you review or debug it.',
  bye: 'Goodbye! Have a great day! 👋',
  thanks: "You're welcome! Let me know if you need anything else.",
};

function findReply(input: string): string | null {
  const lower = input.toLowerCase().trim();
  for (const [keyword, reply] of Object.entries(replies)) {
    if (lower.includes(keyword)) return reply;
  }
  return null;
}

const fallbackReplies = [
  "That's interesting! Tell me more.",
  'I see. What else is on your mind?',
  "Great question! I'm still learning, but let me try my best.",
  "Hmm, I don't have a ready answer for that. Could you rephrase?",
  "I'm listening! Feel free to share whatever you'd like.",
];

export async function getAIResponse(userMessage: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
  return findReply(userMessage) ?? fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
}
