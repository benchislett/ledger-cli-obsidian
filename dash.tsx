import React from 'react';
import { useState, useEffect } from 'react';

import ReactApexChart from 'react-apexcharts';

import { invoke_ledger } from './invoke';
import { ApexOptions } from 'apexcharts';

interface ExpenseSummary {
    account: string;
    amount: number;
}

function parseLedgerOutput(rawOutput: string): ExpenseSummary[] {
    /**
     * Parses the raw text output from Ledger into an array of Expense objects.
     *
     * @param rawOutput - The raw text output from the Ledger tool.
     * @returns An array of Expense objects.
     */
    const expenses: ExpenseSummary[] = [];
    const lines = rawOutput.trim().split("\n");

    lines.forEach((line) => {
        const [account, ...rest] = line.split(","); // Split on the first comma
        const amountStr = rest.join(","); // Rejoin the rest of the line
        if (account && amountStr) {
            const amount = parseFloat(amountStr.replace(/,/g, "").replace('$', '')); // Remove commas and convert to number
            expenses.push({ account: account.trim(), amount });
        }
    });

    return expenses;
}

interface MyDate {
    year: number;
    month: number;
    day: number;
}

function addMonths(date: MyDate, months: number): MyDate {
    let newDate = { year: date.year, month: date.month + months, day: date.day };
    if (newDate.month > 12) {
        newDate.year += Math.floor(newDate.month / 12);
        newDate.month = newDate.month % 12;
    }
    return newDate;
}

function addWeeks(date: MyDate, weeks: number): MyDate {
    let newDate = { year: date.year, month: date.month, day: date.day + weeks * 7 };
    if (newDate.day > 30) {
        newDate.month += Math.floor(newDate.day / 30);
        newDate.day = newDate.day % 30;
    }
    return newDate;
}

function formatDate(date: MyDate): string {
    return `${date.year}/${date.month}/${date.day}`;
}

function dollarFormatter(n: number, _?: any): string {
    return "$" + n.toFixed(2);
}

function dollarStrFormatter(s: string): string {
    return "$" + Number.parseFloat(s).toFixed(2);
}

export const Button: React.FC<{
    selected: boolean;
    action?: () => void;
  }> = (props): React.JSX.Element => {
    const className = [props.selected ? 'mod-cta' : null]
      .filter((n) => n)
      .join(' ');
    return (
      <button className={className} onClick={props.action}>
        {(props as any).children}
      </button>
    );
  };

const ApexChart = (expenseSummaries: ExpenseSummary[]) => {
    const height = 600;
    let series = [];
    let categories: string[] = [];
    let accounts: string[] = [];
    let i = 0;
    for (const expense of expenseSummaries) {
        const category = expense.account.split(':').slice(0, 2).join(':');
        if (!categories.includes(category)) {
            categories.push(category);
        }
        accounts.push(expense.account);
    }

    const stack_categories = true;
    if (stack_categories) {
        for (const expense of expenseSummaries) {
            let subseries = Array.from({ length: categories.length }, () => 0);
            for (let i = 0; i < categories.length; i++) {
                if (expense.account.startsWith(categories[i])) {
                    subseries[i] = expense.amount;
                }
            }
            series.push({ name: expense.account, data: subseries });
        }
    } else {
        let i = 0;
        for (const expense of expenseSummaries) {
            let subseries = Array.from({ length: accounts.length }, () => 0);
            subseries[i++] = expense.amount;
            series.push({ name: expense.account, data: subseries });
        }
    }

    const options = {
        chart: {
            type: 'bar',
            height: height,
            stacked: true,
            toolbar: {
                show: true
            },
            zoom: {
                enabled: false
            }
        },
        dataLabels: {
            formatter: dollarFormatter
        },
        plotOptions: {
            bar: {
                horizontal: false,
                borderRadius: 10,
                borderRadiusApplication: 'end', // 'around', 'end'
                borderRadiusWhenStacked: 'last', // 'all', 'last'
                dataLabels: {
                    total: {
                        enabled: true,
                        style: {
                            fontSize: '13px',
                            fontWeight: 900
                        },
                    },
                }
            },
        },
        xaxis: {
            categories: stack_categories ? categories : accounts,
        },
        yaxis: {
            labels: {formatter: dollarFormatter}, // two decimal points
        },
        fill: {
            opacity: 1
        }
    };

    return (
        <div>
            <div id="chart">
                <ReactApexChart options={options as ApexOptions} series={series} type="bar" height={height} />
            </div>
            <div id="html-dist"></div>
        </div>
    );
}

interface DashboardProps {
    exePath: string;
    filePath: string;
}

const Dashboard: React.FC<DashboardProps> = ({ exePath, filePath }) => {
    const [output, setOutput] = useState<ExpenseSummary[]>([]);
    const [weekly, setWeekly] = useState<boolean>(false);
    const [monthly, setMonthly] = useState<boolean>(true);
    const [startDate, setStartDate] = useState<MyDate>({ year: 2024, month: 12, day: 1 });

    useEffect(() => {
        async function getOutput() {
            const endDate = (weekly ? addWeeks : addMonths)(startDate, 1);
            const rawOutput = await invoke_ledger(exePath, filePath, ['bal', "^Expenses", "--period", `'from ${formatDate(startDate)} to ${formatDate(endDate)}'`, "--format", "\"%(account),%(amount)\\n\"", "--flat"]);
            const expenses = parseLedgerOutput(rawOutput);
            console.debug("Parsed expenses: ", JSON.stringify(expenses));
            setOutput(expenses);
        }
        getOutput();
    }, [startDate]);

    return <div>
        <Button selected={weekly} action={() => { setWeekly(true); setMonthly(false); }}>Weekly</Button>
        <Button selected={monthly} action={() => { setWeekly(false); setMonthly(true); }}>Monthly</Button>
        <Button action={() => { setStartDate((weekly ? addWeeks : addMonths)(startDate, -1)); }}>Previous</Button>
        <Button action={() => { setStartDate((weekly ? addWeeks : addMonths)(startDate, 1)); }}>Next</Button>
        <div>From {formatDate(startDate)}</div>
        {ApexChart(output)}
    </div>
};

export { Dashboard };