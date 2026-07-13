import fs from 'async-file';
import eol from 'eol';

import path from 'node:path';

const crc32Reg = /\s(\w{8})$/;


const reduceContent = (reduced: { [key in string]: string }, line: string) => {
  const tokens = line.split(crc32Reg);
  if (tokens[0] && tokens.length > 1) {
    let name = tokens[0].trim();

    // Quoted filename?
    if (name.startsWith('"') && name.endsWith('"')) {
      name = name.substring(1, name.length - 1);
    }
    
    reduced[name] = tokens[1];
  }

  return reduced;
};

// Remove lines that have been commented out or contain subdirectories
const filterLines = (line: string) => {
  return line && !line.includes(';') && !line.includes('\\');
};

const SFVReader = (directoryPath: string) => {
  const content = {};

  const load = async (sfvName: string) => {
    const filePath = path.join(directoryPath, sfvName);
    const stat = await fs.stat(filePath);

    const sizeMb = stat.size / (1.0*1024.0*1024.0);
    if (sizeMb > 1) {
      throw new Error(`SFV file is too large (${sizeMb} MiB)`);
    }

    const file = await fs.readFile(filePath, 'utf8');
    const loaded = eol.split(file)
      .filter(filterLines)
      .reduce((accumulator, element) => reduceContent(accumulator, element), {});

    if (!Object.keys(loaded).length) {
      throw new Error(`No valid lines were parsed from the SFV file`);
    }

    Object.assign(content, loaded);
  };

  return {
    load,
    content,
  };
};

export default SFVReader;
