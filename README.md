# Kalakriti: AI-Powered Marketplace for Indian Artisans 🎨

> **Empowering 7M+ Indian artisans with Gemini 3 AI—voice-to-listing in 12 languages, AI photo editing, and agentic shopping. Bridging the digital divide, preserving cultural heritage.**

---

## 🌟 Inspiration

India is home to **7 million artisans** creating exquisite handicrafts—Madhubani paintings, Warli art, Kalamkari textiles, and intricate pottery passed down through generations. Yet, most of these artisans:

- 📵 **Cannot use smartphones** effectively due to digital illiteracy
- 🗣️ **Speak only regional languages** (Hindi, Bengali, Tamil, etc.)
- 📸 **Lack professional photography** skills to showcase their art
- 💰 **Lose 40-60% margins** to middlemen who exploit their isolation

We asked ourselves: *What if AI could become the bridge between traditional artisans and the global digital marketplace?*

**Kalakriti was born from this vision**—a platform where an artisan in rural Bihar can speak in Hindi, describe their Madhubani painting, and have AI create a professional e-commerce listing complete with enhanced photos, cultural context, and smart pricing.

---

## 🎯 What We Built

Kalakriti is a **full-stack AI-powered marketplace** that leverages **Gemini 3** to solve the unique challenges faced by Indian artisans.

### Core Features Powered by Gemini 3

| Feature | Gemini 3 Model | Description |
|---------|----------------|-------------|
| **AI Auto-Cataloging** | `gemini-3-flash-preview` | Multimodal product listing from voice + images |
| **Professional Photo Studio** | `gemini-3-pro-image-preview` | AI background removal & image enhancement |
| **Agentic Personal Shopper** | `gemini-3-flash-preview` | Intelligent tool selection & execution |
| **Product-Specific Chatbot** | `gemini-3-flash-preview` | Context-aware Q&A for each product |
| **Cultural Context Engine** | `gemini-3-flash-preview` | Generates heritage information for products |
| **Smart Gift Recommendations** | `gemini-3-flash-preview` | AI-curated gifts based on recipient & occasion |

### Additional AI Integrations

| Feature | Technology | Purpose |
|---------|------------|---------|
| **Multilingual Support** | Bhashini API (`ai4bharat/indictrans-v2`) | Translation across 12 Indian languages |
| **Voice Input** | Bhashini API (`ai4bharat/conformer`) | Speech-to-text for Hindi & regional languages |
| **Smart Logistics** | ShipRocket REST API | Automated shipping & delivery tracking |

---

## 🏗️ How We Built It

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         KALAKRITI ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐        │
│  │   Next.js    │     │   Gemini 3   │     │   Bhashini   │        │
│  │   Frontend   │────▶│   Flash &    │────▶│   API        │        │
│  │   + API      │     │   Pro Image  │     │   (NLP)      │        │
│  └──────────────┘     └──────────────┘     └──────────────┘        │
│         │                    │                    │                 │
│         ▼                    ▼                    ▼                 │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐        │
│  │   Prisma     │     │   Custom     │     │  ShipRocket  │        │
│  │   ORM        │────▶│   AI Agent   │────▶│  Logistics   │        │
│  │              │     │   Framework  │     │              │        │
│  └──────────────┘     └──────────────┘     └──────────────┘        │
│         │                                                           │
│         ▼                                                           │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │              Google Cloud SQL (PostgreSQL)                │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                      │
│  Deployment: Google Cloud Run (Serverless)                          │
└─────────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, React 19, TailwindCSS 4 |
| **Backend** | Next.js API Routes, TypeScript |
| **Database** | PostgreSQL on Google Cloud SQL |
| **ORM** | Prisma |
| **AI/ML** | Gemini 3 Flash, Gemini 3 Pro Image, Bhashini |
| **Deployment** | Google Cloud Run (Serverless) |
| **Logistics** | ShipRocket API |
| **Maps** | Leaflet + OSRM |

### Custom Agentic AI Framework

We built a **custom agent framework** (no LangChain dependency) that enables intelligent tool selection:

```typescript
// AI Agent Architecture
class AIAgent {
  private tools: AgentTool[]  // 5 specialized tools
  
  async processQuery(userMessage: string, context: AgentContext) {
    // Step 1: Gemini 3 analyzes intent & selects tools
    const toolSelection = await this.selectTools(userMessage, context)
    
    // Step 2: Execute selected tools with extracted parameters
    for (const { toolName, parameters } of toolSelection.tools) {
      const result = await tool.execute(parameters, context)
      toolResults[toolName] = result
    }
    
    // Step 3: Generate natural language response
    return await this.generateResponse(userMessage, toolResults)
  }
}
```

**Available Agent Tools:**
1. `search_products` - Advanced product search with filters
2. `recommend_gifts` - AI-curated gift recommendations
3. `analyze_price_range` - Market price analysis
4. `get_cultural_context` - Heritage information retrieval
5. `get_personalized_recommendations` - User history-based suggestions

---

## 🧠 Gemini 3 Integration Deep Dive

### 1. Multimodal Auto-Cataloging

Artisans can create listings by simply:
- 🎤 **Speaking** in their native language
- 📸 **Uploading** a photo of their craft

Gemini 3 Flash processes both inputs to generate:
- Professional title & description
- Relevant tags for searchability
- Suggested pricing based on market analysis
- Cultural significance context

```typescript
// Multimodal product creation
const prompt = `
Analyze this handcrafted product image and voice description.
Generate a professional e-commerce listing with:
- Title, Description, Tags
- Material & Technique detection
- Cultural significance
- Suggested price range
`
const response = await model.generateContent([prompt, imageData, audioText])
```

### 2. AI Photo Studio (Gemini 3 Pro Image)

Rural artisans often photograph products in poor lighting with cluttered backgrounds. Our AI Photo Studio:

- **Enhances** image quality while preserving authenticity
- **Removes/replaces** backgrounds with professional settings
- **Maintains** 100% product authenticity (guardrails enforced)

```typescript
// Responsible AI guardrails
const prompt = `
STRICT REQUIREMENTS:
1. KEEP THE PRODUCT EXACTLY AS IS - preserve all original details
2. DO NOT change product colors, patterns, or textures
3. ONLY enhance: lighting, background, clarity
4. Maintain artisan authenticity at all costs
`
```

### 3. Agentic Personal Shopper

Our agent understands complex queries like:

> *"Find me a gift for my colleague under ₹2000, something traditional from Rajasthan"*

Gemini 3 Flash:
1. Parses intent → Gift recommendation
2. Extracts parameters → recipient: colleague, budget: 2000, origin: Rajasthan
3. Selects tool → `recommend_gifts`
4. Generates response with curated products

---

## 🚧 Challenges We Faced

### 1. **Balancing AI Enhancement vs. Authenticity**

**Challenge:** AI image models tend to "improve" products by changing colors or adding details—destroying the handmade authenticity that makes each piece unique.

**Solution:** We implemented **strict prompt guardrails** that explicitly prohibit modifications to product characteristics:

```typescript
// Guardrail example
"KEEP THE PRODUCT EXACTLY AS IS - do not modify the product itself in any way"
"Preserve all original details, colors, patterns, and textures"
```

### 2. **Multilingual Complexity**

**Challenge:** India has 22 official languages with different scripts (Devanagari, Tamil, Bengali, etc.). Direct translation often loses cultural nuance.

**Solution:** We integrated **Bhashini API** (Government of India's NLP platform) which is specifically trained on Indian languages and cultural context, then used Gemini 3 for semantic understanding.

### 3. **Building Agentic AI Without Wrappers**

**Challenge:** LangChain and similar frameworks add complexity and dependencies. We needed a lightweight, customizable solution.

**Solution:** Built a **custom agent framework** with:
- Tool definitions with JSON schemas
- Gemini 3-powered tool selection
- Fallback intent detection for reliability
- Structured response generation

### 4. **Image Processing at Scale**

**Challenge:** Base64 encoding large images for Gemini 3 Pro Image API calls created memory and latency issues.

**Solution:** 
- Implemented URL-based image fetching
- Added MIME type validation
- Chunked processing for large batches

---

## 📚 What We Learned

### Technical Insights

1. **Gemini 3's multimodal capabilities** are exceptional for real-world applications where users provide mixed inputs (voice + image + text)

2. **Custom agent frameworks** can outperform wrapper libraries when you need precise control over tool selection and execution

3. **Prompt engineering for image generation** requires explicit "do not" instructions to prevent unwanted modifications

4. **Indian language AI** requires specialized models—Bhashini + Gemini 3 combination works better than Gemini alone for regional languages

### Product Insights

1. **Digital illiteracy is a design problem**, not a user problem. Voice-first interfaces can unlock massive underserved markets

2. **Cultural context matters** for e-commerce. A Madhubani painting is not just "wall art"—it's heritage

3. **AI can preserve authenticity** when properly guardrailed, becoming an enabler rather than a homogenizer

---

## 🔮 Future Roadmap

| Feature | Technology | Status |
|---------|------------|--------|
| AR Product Preview | Gemini 3 + WebXR | Planned |
| Artisan Story Videos | Gemini 3 Video | Planned |
| Real-time Translation Chat | Gemini 3 + Bhashini | In Progress |
| ONDC Integration | Open Network Protocol | Planned |
| Blockchain Authenticity | Hyperledger | Research |

---

## 🏆 Impact Metrics

| Metric | Value |
|--------|-------|
| **Target Artisans** | 7+ Million in India |
| **Languages Supported** | 12 (Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Odia, Punjabi, Urdu, English) |
| **Margin Improvement** | 40-60% (eliminating middlemen) |
| **Listing Creation Time** | Reduced from hours to minutes |
| **Photo Quality** | Professional studio-grade from smartphone photos |

---

## 👥 Team

Built with ❤️ for India's artisan community.

---

## 📎 Links

- **Live Demo:** [Deployed on Google Cloud Run]
- **GitHub:** [Repository Link]
- **Video Demo:** [YouTube Link]

---

## 🙏 Acknowledgments

- **Google** for Gemini 3 API access
- **Bhashini (MeitY, Govt. of India)** for Indian language NLP
- **ShipRocket** for logistics API
- **India's artisan communities** for inspiring this solution

---

*"Technology should adapt to people, not the other way around."*

**Kalakriti—Where Tradition Meets AI** 🇮🇳
