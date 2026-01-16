export class Logger {
    private static getTimestamp(): string {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const ms = now.getMilliseconds().toString().padStart(3, '0');
        return `[${hours}:${minutes}:${seconds}.${ms}]`;
    }

    static info(message: string, ...args: any[]) {
        console.log(`${this.getTimestamp()} [INFO] ${message}`, ...args);
    }

    static error(message: string, ...args: any[]) {
        console.error(`${this.getTimestamp()} [ERROR] ${message}`, ...args);
    }

    static warn(message: string, ...args: any[]) {
        console.warn(`${this.getTimestamp()} [WARN] ${message}`, ...args);
    }

    static debug(message: string, ...args: any[]) {
        if (process.env.DEBUG === 'true') {
            console.log(`${this.getTimestamp()} [DEBUG] ${message}`, ...args);
        }
    }
}
