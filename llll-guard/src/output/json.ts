import type { ScanResult } from '../types.js';

export function printJsonResult(result: ScanResult): void {
  console.log(JSON.stringify(result, null, 2));
}
