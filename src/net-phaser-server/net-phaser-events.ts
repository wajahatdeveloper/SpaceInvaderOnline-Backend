// Define a callback function type
type Callback<T> = (data: T, event: NetEvent) => void;

// Define an enum for different uses
export enum NetEvent {
  OnPlayerConnected,
  OnPlayerDisconnected,
}

class EventManager<T> {
  private callbacks: Map<NetEvent, Callback<T>[]> = new Map();

  // Method to register a callback for a specific outcome
  registerCallback(outcome: NetEvent, callback: Callback<T>): void {
    const callbacks = this.callbacks.get(outcome) || [];
    callbacks.push(callback);
    this.callbacks.set(outcome, callbacks);
  }

  // Method to trigger callbacks for a specific outcome
  triggerCallback(outcome: NetEvent, data: T): void {
    const callbacks = this.callbacks.get(outcome) || [];
    callbacks.forEach(callback => {
      callback(data, outcome);
    });
  }
}

export const eventManager = new EventManager<any>();
