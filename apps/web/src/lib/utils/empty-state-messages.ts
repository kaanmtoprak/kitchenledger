export const READ_ONLY_EMPTY_HINT =
  'Görüntüleme yetkiniz var; yeni kayıt oluşturmak için yöneticinizle iletişime geçin.';

export function emptyListTitle(canMutate: boolean, specificTitle: string) {
  return canMutate ? specificTitle : 'Bu alanda henüz kayıt yok.';
}
