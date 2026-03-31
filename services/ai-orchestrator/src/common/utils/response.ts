export function success<T>(data: T) {
  return { code: 0, message: 'ok', data };
}
