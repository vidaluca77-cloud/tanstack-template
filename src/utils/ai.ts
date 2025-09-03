import { createServerFn } from '@tanstack/react-start'
import { Anthropic } from '@anthropic-ai/sdk'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const DEFAULT_SYSTEM_PROMPT = `Vous êtes l'Agent IA Calvados, un assistant intelligence artificielle au service des citoyens du département du Calvados en Normandie, France. Votre mission est d'aider les citoyens avec :

1. **Services publics départementaux** :
   - Conseil départemental du Calvados
   - Services sociaux et aide aux familles
   - Routes départementales et transports
   - Collèges et éducation
   - Aide aux personnes âgées et handicapées

2. **Démarches administratives** :
   - Cartes d'identité et passeports
   - Permis de conduire
   - Cartes grises
   - État civil
   - Démarches en ligne

3. **Informations locales** :
   - Mairies du Calvados
   - Services de santé
   - Culture et patrimoine normand
   - Tourisme en Normandie
   - Événements départementaux

4. **Aide et orientation** :
   - Guider vers les bons interlocuteurs
   - Expliquer les procédures
   - Fournir les horaires et contacts
   - Informer sur les droits et aides disponibles

**Directives de réponse** :
- Répondez toujours en français
- Soyez courtois, professionnel et bienveillant
- Utilisez le Markdown pour structurer vos réponses
- Quand vous ne savez pas, orientez vers les services compétents
- Mentionnez les sites officiels (calvados.fr, service-public.fr)
- Adaptez votre niveau de langage à tous les publics

**Formatage des réponses** :
- Utilisez # ## ### pour les titres
- **Gras** pour les points importants  
- *Italique* pour l'emphase
- \`code\` pour les références officielles
- > pour les citations importantes
- Listes à puces et numérotées selon le contexte

Restez dans votre rôle d'agent public au service des citoyens du Calvados.`

// Non-streaming implementation
export const genAIResponse = createServerFn({ method: 'GET', response: 'raw' })
  .validator(
    (d: {
      messages: Array<Message>
      systemPrompt?: { value: string; enabled: boolean }
    }) => d,
  )
  // .middleware([loggingMiddleware])
  .handler(async ({ data }) => {
    // Check for API key in environment variables
    const apiKey = process.env.ANTHROPIC_API_KEY || import.meta.env.VITE_ANTHROPIC_API_KEY

    if (!apiKey) {
      throw new Error(
        'Missing API key: Please set VITE_ANTHROPIC_API_KEY in your environment variables or VITE_ANTHROPIC_API_KEY in your .env file.'
      )
    }
    
    // Create Anthropic client with proper configuration
    const anthropic = new Anthropic({
      apiKey,
      // Add proper timeout to avoid connection issues
      timeout: 30000 // 30 seconds timeout
    })

    // Filter out error messages and empty messages
    const formattedMessages = data.messages
      .filter(
        (msg) =>
          msg.content.trim() !== '' &&
          !msg.content.startsWith('Sorry, I encountered an error'),
      )
      .map((msg) => ({
        role: msg.role,
        content: msg.content.trim(),
      }))

    if (formattedMessages.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid messages to send' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const systemPrompt = data.systemPrompt?.enabled
      ? `${DEFAULT_SYSTEM_PROMPT}\n\n${data.systemPrompt.value}`
      : DEFAULT_SYSTEM_PROMPT

    // Debug log to verify prompt layering
    console.log('System Prompt Configuration:', {
      hasCustomPrompt: data.systemPrompt?.enabled,
      customPromptValue: data.systemPrompt?.value,
      finalPrompt: systemPrompt,
    })

    try {
      const response = await anthropic.messages.stream({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        system: systemPrompt,
        messages: formattedMessages,
      })

      return new Response(response.toReadableStream())
    } catch (error) {
      console.error('Error in genAIResponse:', error)
      
      // Error handling with specific messages
      let errorMessage = 'Failed to get AI response'
      let statusCode = 500
      
      if (error instanceof Error) {
        if (error.message.includes('rate limit')) {
          errorMessage = 'Rate limit exceeded. Please try again in a moment.'
        } else if (error.message.includes('Connection error') || error.name === 'APIConnectionError') {
          errorMessage = 'Connection to Anthropic API failed. Please check your internet connection and API key.'
          statusCode = 503 // Service Unavailable
        } else if (error.message.includes('authentication')) {
          errorMessage = 'Authentication failed. Please check your Anthropic API key.'
          statusCode = 401 // Unauthorized
        } else {
          errorMessage = error.message
        }
      }
      
      return new Response(JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.name : undefined
      }), {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }) 