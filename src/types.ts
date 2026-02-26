export type FigureId = 'god' | 'buddha' | 'allah'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface FigureTheme {
  id: FigureId
  name: string
  nameCn: string
  subtitle: string
  subtitleCn: string
  avatar: string
  accentColor: string
  bgGradient: string
  bubbleAssistantBg: string
  bubbleAssistantColor: string
  bubbleUserBg: string
  bubbleUserColor: string
  headerBorder: string
  inputBorderFocus: string
  typingDotColor: string
  welcomeText: string
  welcomeTextCn: string
  placeholder: string
  placeholderCn: string
}
