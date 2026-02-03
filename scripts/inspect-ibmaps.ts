import { readFileSync } from 'node:fs';

const filePath = process.argv[2];
const targetAddress = process.argv[3];

if (!filePath) {
  console.error(
    'Usage: pnpm exec tsx scripts/inspect-ibmaps.ts <file> [address]',
  );
  process.exit(1);
}

const xml = readFileSync(filePath, 'utf8');

const ids: number[] = [];
const idRegex = /<Signal ID="(\d+)"/g;
let match: RegExpExecArray | null;
while ((match = idRegex.exec(xml)) !== null) {
  ids.push(Number(match[1]));
}

const unique = Array.from(new Set(ids)).sort((a, b) => a - b);
const gaps: Array<[number, number]> = [];
for (let i = 1; i < unique.length; i += 1) {
  if (unique[i] !== unique[i - 1] + 1) {
    gaps.push([unique[i - 1], unique[i]]);
  }
}

console.log('COUNT', unique.length);
console.log('FIRST_IDS', unique.slice(0, 20));
console.log('LAST_IDS', unique.slice(-20));
console.log('GAPS', gaps);

if (targetAddress) {
  const signalRegex = new RegExp(
    `<Signal ID=\\"\\d+\\">[\\s\\S]*?<Address>${targetAddress}<\\/Address>[\\s\\S]*?<\\/Signal>`,
  );
  const signalMatch = xml.match(signalRegex);
  if (!signalMatch) {
    console.log('ADDRESS_NOT_FOUND', targetAddress);
    process.exit(0);
  }

  const signal = signalMatch[0];
  const grab = (tag: string) => {
    const tagRegex = new RegExp(`<${tag}>([^<]*)<\\/${tag}>`);
    const tagMatch = signal.match(tagRegex);
    return tagMatch ? tagMatch[1] : '';
  };

  console.log('ADDRESS', targetAddress);
  console.log('LENBITS', grab('LenBits'));
  console.log('FORMAT', grab('Format'));
  console.log('BYTEORDER', grab('ByteOrder'));
  console.log('DEADBAND', grab('Deadband'));
}
