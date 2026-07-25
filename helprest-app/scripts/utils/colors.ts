export const color = {
    green: (text: string) => `\x1b[32m${text}\x1b[0m`,
    red: (text: string) => `\x1b[31m${text}\x1b[0m`,
    yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
    cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
    blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
    bold: (text: string) => `\x1b[1m${text}\x1b[0m`,
    dim: (text: string) => `\x1b[2m${text}\x1b[0m`,
};

export const log = {
    info: (msg: string) => console.log(`${color.cyan("[INFO]")} ${msg}`),
    success: (msg: string) => console.log(`${color.green("[SUCCESS]")} ${msg}`),
    warn: (msg: string) => console.log(`${color.yellow("[WARNING]")} ${msg}`),
    error: (msg: string) => console.error(`${color.red("[ERROR]")} ${msg}`),
};
