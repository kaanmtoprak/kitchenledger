export function toStartOfDayIso(date: string) {
  return new Date(`${date}T00:00:00`).toISOString();
}

export function toEndOfDayIso(date: string) {
  return new Date(`${date}T23:59:59.999`).toISOString();
}
