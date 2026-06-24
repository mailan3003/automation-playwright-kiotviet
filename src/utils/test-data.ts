/**
 * Sinh test data unique + traceable.
 * Format: [prefix]_[testName]_[timestamp]
 */
export class TestDataGenerator {
  private static timestamp(): string {
    return Date.now().toString();
  }

  static email(testName: string, domain = 'auto.test'): string {
    return `auto_${testName}_${this.timestamp()}@${domain}`;
  }

  static username(testName: string): string {
    return `auto_${testName}_${this.timestamp()}`;
  }

  static phone(): string {
    const suffix = this.timestamp().slice(-8);
    return `09${suffix}`;
  }

  static fullName(prefix = 'Auto Test'): string {
    return `${prefix} ${this.timestamp()}`;
  }

  static code(testName: string): string {
    return `TC_${testName.toUpperCase()}_${this.timestamp()}`;
  }

  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static randomString(length = 8): string {
    return Math.random().toString(36).substring(2, 2 + length);
  }
}
