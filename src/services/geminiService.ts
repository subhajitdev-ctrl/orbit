import { Message, UserProfile, Task } from "../types";

const EXPERT_PERSONA = `You are a human world-class mentor, a master of psychology, career strategy, and emotional intelligence. Your voice is calm, authoritative yet deeply empathetic, and profoundly insightful. You are NOT a generic AI; you are a high-level advisor for both everyday people and VIPs/celebrities.

Core Principles:
1. Deep Insight: Never give surface-level advice. Analyze the user's specific symptoms, goals, age range, and life context (VIP or average) to provide "magic" results.
2. Human Connection: Speak like a wise, experienced human mentor. Use warmth, directness, and profound understanding.
3. No Medicine: Never recommend specific medications. If you detect a clinical emergency or severe risk, immediately advise seeking a physical doctor or emergency services with urgency and care.
4. Cultural Nuance: Respect the user's country, language, and cultural background.
5. Action-Oriented: Every interaction should lead to a "step ahead" in their journey from Zero to Hero.
6. Memory: You remember everything the user has shared. Use their profile (symptoms, goals, level, age range) to tailor every word.

Conversation Reality Detection & Safety:
- Trolling/Bullshit: If a user is clearly making fun, speaking nonsense, or trolling, do not get defensive. Calmly and politely redirect them to a productive topic or decline to engage in irrelevant banter. Maintain your professional mentor persona.
- Suicidal Threats/Self-Harm: If you detect any mention of suicide, self-harm, or immediate danger, you MUST prioritize safety. Provide immediate help resources (like international helplines) and strongly urge them to contact a professional or emergency services immediately. Do this with extreme empathy and care.
- Reality Check: Distinguish between genuine distress and "making fun". If it's a joke, you can acknowledge it with a dry, mentor-like wit, but always steer back to their growth.

Your goal is to help them win against depression, anxiety, trauma, or addiction, and to guide them toward the right career, relationship, and self-understanding.`;

export async function getMentorResponse(
  messages: Message[], 
  userProfile: UserProfile
) {
  const userTime = new Date().toLocaleString();
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const geminiMessages = messages.map(m => {
    const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [{ text: m.content || (m.attachments ? "[Sent attachments]" : "") }];
    
    if (m.attachments) {
      m.attachments.forEach(att => {
        if (att.type === 'image') {
          const base64Data = att.url.split(',')[1];
          if (base64Data) {
            parts.push({
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Data
              }
            });
          }
        } else {
          parts[0].text += `\n[Attachment: ${att.type} - ${att.name || 'unnamed'}]`;
        }
      });
    }

    return {
      role: m.role === 'user' ? 'user' : 'model',
      parts
    };
  });

  const systemInstruction = `${EXPERT_PERSONA}

User Profile: ${JSON.stringify(userProfile)}

Current Context:
- User's Local Time: ${userTime}
- User's Timezone: ${userTimeZone}

IMPORTANT: 
1. Use the "Current Context" (Time/Date/Timezone) to be aware of the user's day. If it's morning, greet them accordingly. If it's late at night, be mindful of their rest.
2. Detect the user's language from their last message. If they speak in Hindi, reply in Hindi. If they speak in English, reply in English. Always match the user's preferred language or the language they are currently using.
3. Tailor your advice based on their Age Range: ${userProfile.ageRange || 'Not specified'}. A teenager needs different guidance than a 40-year-old executive.
4. Apply the "Conversation Reality Detection" rules strictly.`;

  const response = await fetch("/api/gemini/mentor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: geminiMessages, userProfile, systemInstruction }),
  });

  if (!response.ok) throw new Error("Mentor response failed");
  const data = await response.json();
  return data.text;
}

export async function generateDailyTasks(userProfile: UserProfile): Promise<Task[]> {
  const taskCount = userProfile.subscription === 'free' ? 3 : 5;
  const prompt = `As a world-class mentor, generate ${taskCount} highly personalized, expert-level daily tasks for a user with these symptoms: ${userProfile.symptoms.join(', ')} and goals: ${userProfile.goals.join(', ')}. 
    Current Level: ${userProfile.level}/100.
    Subscription Plan: ${userProfile.subscription.toUpperCase()}.
    
    The tasks must be:
    1. Deeply relevant to their specific psychological or career needs.
    2. Actionable and designed for "Zero to Hero" progress.
    3. Categorized as: Mental Health, Habit Building, Career Development, or Physical Health.
    
    Return as a JSON array of tasks with: id (string), title (string), description (string), category (string).`;

  const response = await fetch("/api/gemini/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) throw new Error("Task generation failed");
  const data = await response.json();

  try {
    const tasks = JSON.parse(data.text);
    return tasks.map((t: Task) => ({
      ...t,
      completed: false,
      dueDate: new Date().toISOString().split('T')[0],
    }));
  } catch (e) {
    console.error("Failed to parse tasks", e);
    return [];
  }
}

export async function generateSpeech(text: string, voiceName: string = 'Kore') {
  const response = await fetch("/api/gemini/speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voiceName }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data.audio || null;
}

export async function transcribeAudio(base64Audio: string): Promise<string | null> {
  const prompt = "Transcribe this audio. Return ONLY the transcribed text, nothing else. If it's silent, return an empty string.";
  
  const response = await fetch("/api/gemini/transcribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64Audio, prompt }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data.text || null;
}

export async function generateImage(prompt: string): Promise<string | null> {
  const response = await fetch("/api/gemini/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data.url || null;
}
