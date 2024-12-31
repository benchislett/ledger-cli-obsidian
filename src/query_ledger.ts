import { invoke_ledger } from "./invoke_ledger_cli";

interface BalanceRecord {
    account: string;
    amount: number;
}

interface AccountBalances {
    [account: string]: number;
}

function collateBalanceRecords(records: BalanceRecord[]): AccountBalances {
    return records.reduce((acc: AccountBalances, record: BalanceRecord) => {
        acc[record.account] = (acc[record.account] || 0) + record.amount;
        return acc;
    }, {});
}

/**
 * Queries the accounts from the ledger transactions file
 * @param exePath Path to the ledger executable
 * @param filePath Path to the transactions file to be used
 * @returns Promise<string[]> Promise that resolves to the list of accounts
 */
async function query_accounts(exePath: string, filePath: string): Promise<string[]> {
    const rawOutput = await invoke_ledger(exePath, filePath, ["accounts"]);
    const accounts = rawOutput.trim().split("\n");
    return accounts;
}

/**
 * Queries the balance of accounts in a given range
 * @param exePath Path to the ledger executable
 * @param filePath Path to the transactions file to be used
 * @param startDate: Start date of the range
 * @param endDate: End date of the range
 * @returns Promise<AccountBalances> Promise that resolves to the balances for each account over the range
 */
async function query_balance_range(exePath: string, filePath: string, startDate: string, endDate: string): Promise<AccountBalances> {
    const rawOutput = await invoke_ledger(exePath, filePath, ['bal', "--period", `'from ${startDate} to ${endDate}'`, "--format", "\"%(account),%(amount)\\n\"", "--flat", "--basis"]);
    const expenses = rawOutput.trim().split("\n").map((line: string) => {
        const [account, ...rest] = line.split(",");
        const amountStr = rest.join(",");
        if (account && amountStr) {
            const amount = parseFloat(amountStr.replace(/,/g, "").replace('$', ''));
            return { account: account.trim(), amount };
        }
        return null;
    }).filter((expense: BalanceRecord | null) => expense !== null) as BalanceRecord[];
    return collateBalanceRecords(expenses);
}

export { query_accounts, query_balance_range, collateBalanceRecords };
export type { BalanceRecord, AccountBalances };
