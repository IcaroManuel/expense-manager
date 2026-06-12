import { Injectable, Logger } from '@nestjs/common';

export type DomainEvent = { name: string; payload: any };

export interface Observer {
  update(event: DomainEvent): void;
}

@Injectable()
export class EventHub {
  private observers: Observer[] = [];
  private readonly logger = new Logger(EventHub.name);

  subscribe(observer: Observer): void {
    this.observers.push(observer);
  }

  publish(event: DomainEvent): void {
    for (const obs of this.observers) {
      try {
        obs.update(event);
      } catch (error: any) {
        this.logger.error(`Observer failed for event ${event.name}`, error.stack);
      }
    }
  }
}

@Injectable()
export class LoggingObserver implements Observer {
  private readonly logger = new Logger(LoggingObserver.name);

  update(event: DomainEvent): void {
    this.logger.log(`event=${event.name} payload=${JSON.stringify(event.payload)}`);
  }
}

export class CallbackObserver implements Observer {
  constructor(private readonly callback: (event: DomainEvent) => void) {}

  update(event: DomainEvent): void {
    this.callback(event);
  }
}
