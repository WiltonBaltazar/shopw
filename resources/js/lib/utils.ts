export function formatPrice(value: number): string {
  return `${value.toLocaleString('pt-MZ')} MT`
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
