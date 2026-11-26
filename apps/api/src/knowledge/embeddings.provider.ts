export interface EmbeddingsProvider {
  embedTexts(texts: string[]): Promise<number[][]>;
  readonly model: string;
  readonly dimensions: number;
}
