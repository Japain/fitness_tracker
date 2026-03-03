import { apiRequest } from './client';

interface QueuedRequest {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body: unknown;
  timestamp: number;
  retries: number;
}

const STORAGE_KEY = 'fitness-tracker:request-queue';
const MAX_RETRIES = 3;

class RequestQueue {
  private queue: QueuedRequest[] = [];
  private isProcessing = false;

  constructor() {
    this.loadFromStorage();
    window.addEventListener('online', () => this.processQueue());
  }

  async enqueue(url: string, method: QueuedRequest['method'], body: unknown): Promise<string> {
    const request: QueuedRequest = {
      id: crypto.randomUUID(),
      url,
      method,
      body,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(request);
    this.saveToStorage();

    if (navigator.onLine) {
      await this.processQueue();
    }

    return request.id;
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const request = this.queue[0];
      try {
        await apiRequest(request.url, { method: request.method, body: request.body });
        this.queue.shift();
        this.saveToStorage();
      } catch (error) {
        if (!navigator.onLine) {
          break;
        }
        request.retries++;
        if (request.retries >= MAX_RETRIES) {
          console.error('Request failed after max retries, dropping:', request);
          this.queue.shift();
          this.saveToStorage();
        } else {
          await this.delay(Math.pow(2, request.retries) * 1000);
        }
      }
    }

    this.isProcessing = false;
  }

  get pendingCount(): number {
    return this.queue.length;
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch {
      // Storage full or unavailable — silently ignore
    }
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.queue = JSON.parse(saved) as QueuedRequest[];
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      this.queue = [];
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const requestQueue = new RequestQueue();
