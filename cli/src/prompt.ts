/**
 * Asking, with no dependency.
 *
 * `node:readline/promises` is enough for a numbered list, and a prompt library
 * would be the CLI's only runtime dependency — on a tool whose entire job is to
 * be run once, by `npx`, on a machine that has just met it.
 */

import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

export type Choice<T extends string> = { value: T; label: string; note?: string };

export async function ask<T extends string>(question: string, choices: readonly Choice<T>[]): Promise<T> {
  const rl = createInterface({ input: stdin, output: stdout });

  try {
    stdout.write(`\n${question}\n`);

    choices.forEach((choice, index) => {
      const note = choice.note ? `  — ${choice.note}` : '';
      stdout.write(`  ${String(index + 1)}) ${choice.label}${note}\n`);
    });

    for (;;) {
      const answer = (await rl.question(`Choose 1-${String(choices.length)} [1]: `)).trim();
      const index = answer === '' ? 0 : Number(answer) - 1;
      const choice = choices[index];

      if (choice) return choice.value;

      stdout.write(`  Not one of the options.\n`);
    }
  } finally {
    rl.close();
  }
}

export async function askName(fallback: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });

  try {
    const answer = (await rl.question(`\nProject name [${fallback}]: `)).trim();

    return answer === '' ? fallback : answer;
  } finally {
    rl.close();
  }
}
