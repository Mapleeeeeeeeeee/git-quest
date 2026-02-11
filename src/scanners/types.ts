export interface ScanResult {
  id: string;
  title: string;
  description: string;
  filePath: string;
  line?: number;
  scanner: string;
  difficulty: 1 | 2 | 3;
  xp: number;
  hint: string;
}

export interface Scanner {
  name: string;
  scan(rootDir: string): Promise<ScanResult[]>;
}
