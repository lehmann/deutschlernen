export type Theme =
  | 'rotina'
  | 'trabalho'
  | 'familia'
  | 'compras'
  | 'transporte'
  | 'saude'
  | 'moradia'
  | 'tempo_livre'
  | 'opinioes'
  | 'planos'
  | 'verbos_essenciais'
  | 'essen'
  | 'clima'
  | 'sentimentos'
  | 'educacao'

export const THEME_LABELS: Record<Theme, string> = {
  rotina: 'Rotina',
  trabalho: 'Trabalho',
  familia: 'Família',
  compras: 'Compras',
  transporte: 'Transporte',
  saude: 'Saúde',
  moradia: 'Moradia',
  tempo_livre: 'Tempo Livre',
  opinioes: 'Opiniões',
  planos: 'Planos',
  verbos_essenciais: 'Verbos Essenciais',
  essen: 'Comida & Bebida',
  clima: 'Clima & Tempo',
  sentimentos: 'Sentimentos',
  educacao: 'Educação',
}

export type WordType = 'verb' | 'noun' | 'adjective' | 'phrase' | 'expression'

export interface VocabEntry {
  id: string
  type: WordType
  theme: Theme
  german: string
  portuguese: string
  // For nouns
  article?: 'der' | 'die' | 'das'
  plural?: string
  // For verbs with required preposition
  preposition?: string
  // Context sentence (key to the PDF strategy)
  exampleDE: string
  examplePT: string
  // Optional fill-in-blank
  fillBlank?: { sentence: string; answer: string }
}

// Card types as described in PDF section 04
export type CardType =
  | 'pt_to_de'        // Portuguese → German sentence
  | 'de_to_pt'        // German → Portuguese meaning
  | 'fill_blank'      // Complete the sentence
  | 'article_recall'  // What is the article?
  | 'preposition'     // What preposition does this verb take?

export interface ReviewCard {
  id: string          // `${vocabId}:${type}`
  vocabId: string
  type: CardType
  front: string
  back: string
  hint?: string
}

// SM-2 progress state per card
export interface CardProgress {
  cardId: string
  easiness: number      // EF factor, starts at 2.5, min 1.3
  interval: number      // days
  repetitions: number   // consecutive correct reviews
  nextReview: string    // ISO date
  lastReview: string    // ISO date
}

export interface NotificationPrefs {
  // 'not_asked' = we haven't shown our prompt yet
  // 'accepted'  = user said yes (browser permission may still be 'denied' if they blocked it)
  // 'declined'  = user said no → never ask again
  appPermission: 'not_asked' | 'accepted' | 'declined'
  sessions: string[]        // ISO datetimes of completed review sessions (for UI display)
  lastReminderAt: string | null
  subscriptionId: string | null  // server-assigned ID, used to report sessions
}

export interface AppState {
  schemaVersion: number
  progress: Record<string, CardProgress>
  activeVocabIds: string[]
  notifications: NotificationPrefs
}

// Quality rating shown to user (simplified from SM-2's 0-5)
export type Rating = 'again' | 'hard' | 'good' | 'easy'

export const RATING_TO_QUALITY: Record<Rating, number> = {
  again: 1,
  hard: 2,
  good: 4,
  easy: 5,
}
