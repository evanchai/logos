const isChinese = /^zh/i.test(navigator.language)

export function t(en: string, zh: string): string {
  return isChinese ? zh : en
}

export { isChinese }
