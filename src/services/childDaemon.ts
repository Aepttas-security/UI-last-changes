import { ParentalRepository } from '../data/parentalRepository';
import { Storage } from '../utils/storage';

class ChildDaemonService {
  private telemetryIntervalId: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;

  /**
   * Start 60-second background telemetry loop and app watchdog daemon
   */
  startDaemon(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[ChildDaemon] Background security daemon started.');

    // Execute immediately on start
    this.sendTelemetryTick();

    // 60-second periodic loop
    this.telemetryIntervalId = setInterval(() => {
      this.sendTelemetryTick();
    }, 60000);
  }

  stopDaemon(): void {
    if (this.telemetryIntervalId) {
      clearInterval(this.telemetryIntervalId);
      this.telemetryIntervalId = null;
    }
    this.isRunning = false;
    console.log('[ChildDaemon] Background security daemon stopped.');
  }

  private async sendTelemetryTick(): Promise<void> {
    try {
      const childId = await Storage.getChildId() || '1';
      // Simulate raw decimal latitude & longitude hardware reading
      const simulatedLat = 13.0827 + (Math.random() - 0.5) * 0.005;
      const simulatedLng = 80.2707 + (Math.random() - 0.5) * 0.005;
      const simulatedBattery = Math.floor(80 + Math.random() * 15);

      await ParentalRepository.pingLocation(
        childId,
        simulatedLat,
        simulatedLng,
        'Live Telemetry Location Ping',
        simulatedBattery
      );
      console.log('[ChildDaemon] Telemetry sent for child:', childId);
    } catch {
      // Silently handle offline telemetry pings without triggering warning popups
    }
  }
}

export const ChildDaemon = new ChildDaemonService();
