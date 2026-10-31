import { EventEmitter } from 'events';

export type RealtimeEvent = Record<string, unknown> & {
  type: string;
  timestamp?: string;
};

class RealtimeBus extends EventEmitter {
  publish(event: RealtimeEvent) {
    this.emit('event', {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    });
  }
}

export const realtime = new RealtimeBus();
