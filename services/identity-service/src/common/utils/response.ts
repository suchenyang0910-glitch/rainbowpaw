export function success(data: any = null, message = 'ok') {
  return {
    code: 0,
    message,
    data,
  };
}

export function fail(code: number, message: string, data: any = null) {
  return {
    code,
    message,
    data,
  };
}