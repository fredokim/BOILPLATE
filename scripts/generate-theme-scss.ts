import * as fs from "fs";
import * as path from "path";

import { lightTheme, darkTheme } from "../src/core/theme/tokens";

function gen(themeName: string, theme: Record<string, string>) {
  let out = `:root[data-theme="${themeName}"] {\n`;
  for (const [k, v] of Object.entries(theme)) {
    out += `  --color-${k}: ${v};\n`;
  }
  out += `}\n\n/* utility classes for ${themeName} */\n`;
  for (const k of Object.keys(theme)) {
    out += `.bg-${k} { background-color: var(--color-${k}); }\n`;
    out += `.text-${k} { color: var(--color-${k}); }\n`;
    out += `.border-${k} { border-color: var(--color-${k}); }\n`;
  }
  out += "\n";
  return out;
}

const scss = `// AUTO-GENERATED\n\n${gen("light", lightTheme)}${gen("dark", darkTheme)}`;
const outPath = path.resolve("src/assets/scss/generated/theme.scss");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, scss, "utf-8");
console.log("✅ theme-classes.scss generated");
