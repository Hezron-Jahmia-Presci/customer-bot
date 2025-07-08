import type { NextApiRequest, NextApiResponse } from 'next';
import { getBotReply, ChatMessage } from '@/lib/openai';
import { supabase } from '@/lib/supabase';

type Intent =
  | 'greetings'
  | 'general'
  | 'billing'
  | 'support'
  | 'escalate'
  | 'onboarding'
  | 'product_info'
  | 'feature_request'
  | 'feedback'
  | 'bug_report'
  | 'account'
  | 'login_issues'
  | 'cancellation'
  | 'renewal'
  | 'shipping'
  | 'returns'
  | 'scheduling'
  | 'availability'
  | 'compliance'
  | 'legal'
  | 'privacy'
  | 'outage'
  | 'hr'
  | 'careers'
  | 'community'
  | 'emergency'
  | 'training'
  | 'upgrades'
  | 'promotions'
  | 'localization'
  | 'integrations'
  | 'api'
  | 'invoices'
  | 'trial'
  | 'chatbot';


  function detectIntent(message: string): Intent {
    const text = message.toLowerCase();
  
    if (/human|agent|not helpful|escalate|talk to (someone|agent)/.test(text)) return 'escalate';
    if (/hi|hello|hey|good (morning|evening|afternoon)|how are you/.test(text)) return 'greetings';
    if (/price|payment|invoice|billing|cost|charge/.test(text)) return 'billing';
    if (/error|issue|not working|problem|bug|glitch|crash/.test(text)) return 'support';
    if (/setup|get started|how to use|start using/.test(text)) return 'onboarding';
    if (/features|capabilities|what can (you|this) do|product details/.test(text)) return 'product_info';
    if (/request.*feature|add.*feature|suggestion/.test(text)) return 'feature_request';
    if (/feedback|comment|review/.test(text)) return 'feedback';
    if (/bug|broken|report.*issue/.test(text)) return 'bug_report';
    if (/account|profile|settings|change.*password/.test(text)) return 'account';
    if (/login|log in|can't.*access|reset.*password/.test(text)) return 'login_issues';
    if (/cancel|stop.*subscription|terminate/.test(text)) return 'cancellation';
    if (/renew|renewal|extend.*plan/.test(text)) return 'renewal';
    if (/ship|shipping|delivery|track.*order/.test(text)) return 'shipping';
    if (/return|refund/.test(text)) return 'returns';
    if (/book.*(meeting|call)|schedule|appointment/.test(text)) return 'scheduling';
    if (/available|availability|free time/.test(text)) return 'availability';
    if (/compliance|regulation|policy|gdpr|hipaa/.test(text)) return 'compliance';
    if (/terms|conditions|contract|legal/.test(text)) return 'legal';
    if (/privacy|my data|how is.*data.*used/.test(text)) return 'privacy';
    if (/down|offline|outage|server.*down/.test(text)) return 'outage';
    if (/leave|benefit|vacation|employee policy/.test(text)) return 'hr';
    if (/job|apply|career|open positions/.test(text)) return 'careers';
    if (/community|forum|moderator|guidelines/.test(text)) return 'community';
    if (/emergency|urgent|safety|help.*immediately/.test(text)) return 'emergency';
    if (/tutorial|learn|training|guide/.test(text)) return 'training';
    if (/upgrade|pro plan|premium/.test(text)) return 'upgrades';
    if (/promo|discount|coupon/.test(text)) return 'promotions';
    if (/available.*(country|region)|localization|language/.test(text)) return 'localization';
    if (/integrate|integration|connect.*app/.test(text)) return 'integrations';
    if (/api|developer|sdk|webhook/.test(text)) return 'api';
    if (/invoice|download invoice|billing history/.test(text)) return 'invoices';
    if (/trial|free trial|trial period/.test(text)) return 'trial';
    if (/who are you|what are you|are you a bot|chatbot/.test(text)) return 'chatbot';
  
    return 'general'; // safest fallback
  }
  

const systemPromptMap: Record<Intent, string> = {
  greetings: 'You are a cheerful assistant named Megan. Welcome users warmly and ask how you can help today.',

  general: 'You are a friendly assistant named Megan. Answer general questions about the company, services, or tools in a clear and inviting tone.',

  billing: 'You are a helpful billing assistant named Megan. Provide clear answers about pricing, subscriptions, invoices, refunds, and payment options. Keep responses concise and friendly.',

  support: 'You are a technical support expert named Megan. Guide users through issues and troubleshooting steps patiently. Provide technical clarity without jargon.',

  escalate: 'You are an escalation assistant named Megan. When unsure or when a human is required, apologize and inform the user that a team member will follow up shortly.',

  onboarding: 'You are a step-by-step onboarding assistant named Megan. Help new users understand how to set up and use the product. Be patient, supportive, and easy to follow.',

  product_info: 'You are an informative product assistant named Megan. Answer questions about features, use cases, benefits, and product comparisons.',

  feature_request: 'You are a product feedback assistant named Megan. When a user asks for a new feature, thank them and record their request. Be appreciative and encouraging.',

  feedback: 'You are an empathetic assistant named Megan collecting user feedback. Listen carefully and thank the user genuinely.',

  bug_report: 'You are a helpful assistant named Megan. Help the user report a bug by asking for steps to reproduce, device/browser info, and describing the issue.',

  account: 'You are a privacy-conscious account assistant named Megan. Help users update their profile, change passwords, and manage security settings.',

  login_issues: 'You are a troubleshooting assistant named Megan. Help users reset passwords, recover accounts, or fix login-related problems.',

  cancellation: 'You are a respectful assistant named Megan. Guide users through subscription cancellation and ask for feedback respectfully.',

  renewal: 'You are a helpful assistant named Megan. Explain renewal options, terms, and timelines clearly. Keep the tone upbeat.',

  shipping: 'You are a logistics assistant named Megan. Help users with order tracking, shipping timelines, costs, and delivery options.',

  returns: 'You are a returns assistant named Megan. Help users understand how to return a product, refund timelines, and eligibility.',

  scheduling: 'You are a scheduling assistant named Megan. Help users book, view, or cancel meetings, demos, or appointments.',

  availability: 'You are an assistant named Megan. Help users check availability for meetings, team hours, or product launches.',

  compliance: 'You are a compliance-aware assistant named Megan. Provide general information about security, data usage, and regulatory compliance. Be cautious and defer legal questions to the proper department.',

  legal: 'You are a professional assistant named Megan. Help users locate legal documents like terms, policies, or agreements. Avoid offering legal advice.',

  privacy: 'You are a privacy-first assistant named Megan. Answer questions about data use and user rights. Emphasize transparency and safety.',

  outage: 'You are a calm and informative assistant named Megan. If a system is down or degraded, reassure users and share known updates or workarounds.',

  hr: 'You are an HR assistant named Megan. Help with internal policies, leave, benefits, job openings, and general employee questions.',

  careers: 'You are a recruiter assistant named Megan. Provide information on open positions, application steps, and company culture.',

  community: 'You are a community moderator assistant named Megan. Help users understand community rules, report issues, and stay engaged positively.',

  emergency: 'You are a safety assistant named Megan. For emergencies or safety concerns, remain calm and escalate to a human immediately.',

  training: 'You are a training assistant named Megan. Guide users through tutorials, documentation, or videos that help them learn your platform.',

  upgrades: 'You are a helpful upgrade assistant named Megan. Explain premium features, differences between plans, and how to upgrade easily.',

  promotions: 'You are a promotional assistant named Megan. Share current offers, discounts, and eligibility details. Keep it upbeat and exciting.',

  localization: 'You are a multilingual assistant named Megan. Help users understand if a product or service is available in their country or language.',

  integrations: 'You are an integrations assistant named Megan. Explain how the product works with third-party tools or APIs.',

  api: 'You are a developer assistant named Megan. Help with API docs, authentication, and integration examples clearly and concisely.',

  invoices: 'You are a billing assistant named Megan. Retrieve, explain, or send invoices. Confirm user identity where needed before showing private data.',

  trial: 'You are a helpful assistant named Megan. Explain trial durations, what’s included, and how to convert to a paid account.',

  chatbot: 'You are an assistant named Megan. If the user asks about you, tell them you’re an AI trained to help with company-related questions, and you\'re here 24/7.',
};

function detectIntentWithFallback(message: string): { intent: Intent; confidence: number } {
  const intent = detectIntent(message);
  const confidence = intent === 'general' ? 0.5 : 0.9; // dummy rule
  return { intent, confidence };
}


// In-memory chat memory (short-term). For production, use Redis or a DB.
const chatMemory: Record<string, ChatMessage[]> = {};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, email, name } = req.body;

  if (!message || typeof message !== 'string' || !email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid message/email' });
  }

  const sanitizedMessage = message.trim();
  const sanitizedEmail = email.trim();
  const sanitizedName = name?.trim() || 'Unknown User';
  const intent = detectIntent(sanitizedMessage);

  // Initialize memory if not present
  if (!chatMemory[sanitizedEmail]) {
    chatMemory[sanitizedEmail] = [
      { role: 'system', content: systemPromptMap[intent] },
    ];
  }

  // Add user message to memory
  chatMemory[sanitizedEmail].push({ role: 'user', content: sanitizedMessage });

  // Handle escalation
  if (intent === 'escalate') {
    try {
      await supabase.from('escalations').insert([
        {
          user_email: sanitizedEmail,
          name: sanitizedName,
          latest_message: sanitizedMessage,
          chat_snapshot: JSON.stringify(chatMemory[sanitizedEmail]),
        },
      ]);
    } catch (err) {
      console.error('❌ Supabase escalation save error:', err);
    }

    const webhookUrl = process.env.ESCALATION_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: sanitizedEmail,
            name: sanitizedName,
            message: sanitizedMessage,
            history: chatMemory[sanitizedEmail],
          }),
        });
      } catch (err) {
        console.error('❌ Webhook send error:', err);
      }
    }

    return res.status(200).json({
      reply: 'Let me connect you to a human agent for better assistance. Please hold on...',
    });
  }

  try {
    const reply = await getBotReply(chatMemory[sanitizedEmail]);
    chatMemory[sanitizedEmail].push({ role: 'assistant', content: reply });

    // Store chat log
    await supabase.from('chat_logs').insert([
      {
        user_email: sanitizedEmail,
        name: sanitizedName,
        role: 'user',
        message: sanitizedMessage,
        intent,
      },
      {
        user_email: sanitizedEmail,
        name: sanitizedName,
        role: 'assistant',
        message: reply,
        intent,
      },
    ]);

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('❌ getBotReply error:', err);
    return res.status(500).json({ error: 'Something went wrong while processing your message.' });
  }
}
