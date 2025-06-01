export const getValueLocalStorage= <T>(key: string): T | null => {
  const item = localStorage.getItem(key);
  if (item) {
    try {
      return JSON.parse(item) as T;
    } catch (error) {
      console.error("Ошибка парсинга JSON:", error);
      return null;
    }
  }
  return null;
}
