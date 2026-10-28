import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchBooks, saveBooks } from '../src/mock-api';

const books = [{ id: '1', title: 'Книга', authors: ['Автор'] }];

describe('mock-api', () => {
  let stored: string | null;

  beforeEach(() => {
    vi.useFakeTimers();
    stored = null;
    vi.stubGlobal('localStorage', {
      getItem: () => stored,
      setItem: (_key: string, value: string) => { stored = value; },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('загружает сохранённые книги после задержки', async () => {
    stored = JSON.stringify(books);
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = fetchBooks();
    await vi.advanceTimersByTimeAsync(800);
    await expect(result).resolves.toEqual(books);
  });

  it('возвращает пустой массив, когда сохранённых книг нет', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = fetchBooks();
    await vi.advanceTimersByTimeAsync(800);
    await expect(result).resolves.toEqual([]);
  });

  it('сообщает об ошибке загрузки', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const result = expect(fetchBooks()).rejects.toThrow('Сбой сети. Не удалось загрузить книги.');
    await vi.advanceTimersByTimeAsync(800);
    await result;
  });

  it('сохраняет книги после задержки и передаёт ошибки хранилища', async () => {
    const result = saveBooks(books);
    await vi.advanceTimersByTimeAsync(499);
    expect(stored).toBeNull();
    await vi.advanceTimersByTimeAsync(1);
    await result;
    expect(JSON.parse(stored!)).toEqual(books);

    vi.stubGlobal('localStorage', { setItem: () => { throw new Error('Ошибка сохранения'); } });
    const failure = expect(saveBooks(books)).rejects.toThrow('Ошибка сохранения');
    await vi.advanceTimersByTimeAsync(500);
    await failure;
  });
});
