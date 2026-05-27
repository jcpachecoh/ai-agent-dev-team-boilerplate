import { EventEmitter } from 'events';

// Increase default max listeners to avoid warnings with many subscriptions
EventEmitter.defaultMaxListeners = 50;

/**
 * A simple in-memory PubSub built on Node's EventEmitter.
 * Suitable for single-instance deployments; swap for Redis PubSub for multi-node.
 */
export interface PubSubEvents {
  [eventName: string]: unknown;
}

class SimplePubSub {
  private readonly emitter = new EventEmitter();

  /**
   * Publish an event payload to all subscribers of `eventName`.
   */
  publish<T = unknown>(eventName: string, payload: T): void {
    this.emitter.emit(eventName, payload);
  }

  /**
   * Returns an AsyncIterable (also an AsyncIterator) that yields payloads for the given event.
   * graphql-ws / Pothos require AsyncIterable<T>.
   */
  asyncIterator<T = unknown>(eventName: string): AsyncIterable<T> & AsyncIterator<T> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const queue: T[] = [];
    let resolve: ((value: IteratorResult<T>) => void) | null = null;
    let done = false;

    const listener = (payload: T): void => {
      if (done) return;
      if (resolve) {
        const cb = resolve;
        resolve = null;
        cb({ value: payload, done: false });
      } else {
        queue.push(payload);
      }
    };

    self.emitter.on(eventName, listener);

    const iterator: AsyncIterable<T> & AsyncIterator<T> = {
      next(): Promise<IteratorResult<T>> {
        if (done) return Promise.resolve({ value: undefined as unknown as T, done: true });
        if (queue.length > 0) {
          return Promise.resolve({ value: queue.shift()!, done: false });
        }
        return new Promise((res) => {
          resolve = res;
        });
      },
      return(): Promise<IteratorResult<T>> {
        done = true;
        self.emitter.off(eventName, listener);
        return Promise.resolve({ value: undefined as unknown as T, done: true });
      },
      throw(err?: unknown): Promise<IteratorResult<T>> {
        done = true;
        self.emitter.off(eventName, listener);
        return Promise.reject(err);
      },
      [Symbol.asyncIterator](): AsyncIterator<T> {
        return this;
      },
    };

    return iterator;
  }
}

export const pubsub = new SimplePubSub();
