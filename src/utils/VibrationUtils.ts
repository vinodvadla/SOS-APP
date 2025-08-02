import { Vibration } from 'react-native';

export class VibrationUtils {
  /**
   * Vibrate with custom pattern
   */
  static vibrate(pattern: number[] = [0, 1000]): void {
    Vibration.vibrate(pattern);
  }

  /**
   * Vibrate for SOS pattern (3 short bursts)
   */
  static vibrateSOS(): void {
    const sosPattern = [
      0, 200, 100, 200, 100, 200,  // S: ... (3 short)
      500, 500, 100, 500, 100, 500, 100, 500,  // O: --- (3 long)
      500, 200, 100, 200, 100, 200,  // S: ... (3 short)
    ];
    Vibration.vibrate(sosPattern);
  }

  /**
   * Vibrate for notification
   */
  static vibrateNotification(): void {
    Vibration.vibrate([0, 100, 50, 100]);
  }

  /**
   * Vibrate for error
   */
  static vibrateError(): void {
    Vibration.vibrate([0, 200, 100, 200, 100, 200]);
  }

  /**
   * Vibrate for success
   */
  static vibrateSuccess(): void {
    Vibration.vibrate([0, 50, 100, 50]);
  }

  /**
   * Stop vibration
   */
  static stopVibration(): void {
    Vibration.cancel();
  }

  /**
   * Vibrate with safety check
   */
  static safeVibrate(pattern: number[] = [0, 1000]): void {
    try {
      this.vibrate(pattern);
    } catch (error) {
      console.warn('Vibration failed:', error);
    }
  }
} 