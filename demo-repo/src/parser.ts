/**
 * Simple markdown parser (already documented — won't trigger missing-docs)
 */
export function parseMarkdown(input: string): string {
  let output = input;
  // Bold
  output = output.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic
  output = output.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Headers
  output = output.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  output = output.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  output = output.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  return output;
}
