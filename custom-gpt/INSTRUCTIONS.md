# No-code version: build the shareable Custom GPT (5 minutes)

This gives you a **live, shareable link** with zero hosting. Great for leads who just want to try it.

## Steps
1. ChatGPT → **Explore GPTs → Create** (needs ChatGPT Plus/Team).
2. **Configure** tab:
   - **Name:** Ask Summit Trails
   - **Description:** Answers questions about Summit Trails tours, prices, and refund policy — from our real docs.
   - **Instructions:** paste the block below.
3. **Knowledge:** upload the three files from `../docs/` (`tours.md`, `refund-policy.md`, `faq.md`).
   (In a real client build, upload their PDFs/policies instead.)
4. **Capabilities:** turn OFF Web Browsing and DALL·E (keep it grounded); Code Interpreter off.
5. **Save → Share → "Anyone with the link."** Copy that link into your portfolio hub and Fiverr gig.

## Instructions to paste
```
You are the Summit Trails assistant, a friendly support agent for a boutique guided-hiking
company in Banff. Answer ONLY from the uploaded knowledge files (tours, pricing, booking, refund
policy). If a question isn't covered, say you're not sure and offer to connect the person to the
team — never invent prices, dates, or policies. Keep answers to 2–4 sentences, warm and clear,
and suggest a relevant tour when it helps. When someone shows booking intent, tell them a 30%
deposit confirms their spot and they can book online or via WhatsApp.
```

## Which to show a lead?
- **Custom GPT link** = instant, no code, non-technical buyers love it.
- **Coded RAG app** (this repo's `/api/ask`) = shows engineering depth (embeddings, retrieval,
  citations, "I don't know" handling). Show both — they prove range.
