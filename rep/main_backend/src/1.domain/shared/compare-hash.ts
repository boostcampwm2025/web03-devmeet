export interface CompareHash {
  compare({ value, hash }: { value: string; hash: string }): Promise<boolean>;
}
