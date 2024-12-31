import { formatDate, MyDate, spanStart, spanPrev, spanNext, currentDate } from './date';
import { query_balance_range, AccountBalances, query_accounts } from './query_ledger';
import { PeriodType } from './ui/datePicker';

/**
 * Cache for ledger balance queries
 * 
 * This class caches the balance queries to the ledger executable, which will come in two types:
 * 1. Per month cache: This will cache the balance of each account for each month, reflected as the change in balance from the previous month
 * 2. Cumulative month cache: This will cache the balance of each account for each month, reflected as the total balance of the account up to that month
 */
class LedgerCache {
    private exePath: string;
    private filePath: string;
    private allAccounts: string[];
    private perMonthCache: { [year: number]: { [month: number]: AccountBalances } };
    private cumulativeMonthCache: { [year: number]: { [month: number]: AccountBalances } };

    constructor(exePath: string, filePath: string) {
        this.exePath = exePath;
        this.filePath = filePath;
        this.perMonthCache = {};
        this.cumulativeMonthCache = {};
        this.allAccounts = [];
    }

    public clear() {
        this.allAccounts = [];
        this.perMonthCache = {};
        this.cumulativeMonthCache = {};
    }

    private addAccounts(accounts: string[]) {
        this.allAccounts = Array.from(new Set([...this.allAccounts, ...accounts]));
    }

    public updateSettings({ exePath, filePath }: { exePath: string, filePath: string }) {
        this.exePath = exePath;
        if (filePath !== this.filePath) {
            this.filePath = filePath;
            this.clear();
        }
    }

    public async getCumulativeBalance(date: MyDate): Promise<AccountBalances> {
        if (this.cumulativeMonthCache[date.year] && this.cumulativeMonthCache[date.year][date.month]) {
            return this.cumulativeMonthCache[date.year][date.month];
        }

        const balances = await query_balance_range(this.exePath, this.filePath, "1970", formatDate(spanNext(date, PeriodType.Month), PeriodType.Month));
        this.cumulativeMonthCache[date.year] = this.cumulativeMonthCache[date.year] || {};
        this.cumulativeMonthCache[date.year][date.month] = balances;
        return balances;
    }

    public async getPerMonthBalance(date: MyDate): Promise<AccountBalances> {
        if (this.perMonthCache[date.year] && this.perMonthCache[date.year][date.month]) {
            return this.perMonthCache[date.year][date.month];
        }

        const balances = await query_balance_range(this.exePath, this.filePath, formatDate(date, PeriodType.Month), formatDate(spanNext(date, PeriodType.Month), PeriodType.Month));
        this.perMonthCache[date.year] = this.perMonthCache[date.year] || {};
        this.perMonthCache[date.year][date.month] = balances;
        return balances;
    }

    public async getAccounts(): Promise<string[]> {
        if (this.allAccounts.length) {
            return this.allAccounts;
        }

        const accounts = await query_accounts(this.exePath, this.filePath);
        this.addAccounts(accounts);
        return this.allAccounts;
    }

    public async prefetch() {
        const promises: any[] = [];
        promises.push(this.getAccounts());
        
        let startDate = spanStart(currentDate(), PeriodType.Month);
        for (let i = 0; i < 12; i++) {
            promises.push(this.getPerMonthBalance(startDate));
            promises.push(this.getCumulativeBalance(startDate));
            startDate = spanPrev(startDate, PeriodType.Month);
        }

        await Promise.all(promises);
    }
};

export { LedgerCache };