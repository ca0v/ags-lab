export function keys<T>(o: T): Array<keyof T> {
  return <any>Object.keys(o);
}
