import { EventEmitter } from 'events';

export type RealtimeEvent = Record<string, unknown> & {
  type: string;
  timestamp?: string;
};

class RealtimeBus extends EventEmitter {
  private readonly latestProgressByProject = new Map<string, RealtimeEvent>();

  publish(event: RealtimeEvent) {
    const published: RealtimeEvent = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    };

    if ((published.type === 'pipeline_progress' || published.type === 'render_progress') && typeof published.projectId === 'string') {
      this.latestProgressByProject.set(published.projectId, published);
    }

    this.emit('event', published);
  }

  progressSnapshot(): RealtimeEvent[] {
    return [...this.latestProgressByProject.values()];
  }
}

export const realtime = new RealtimeBus();
