import React from 'react';
import { useState, useEffect } from 'react';

import ReactApexChart from 'react-apexcharts';

import { invoke_ledger } from '../invoke';

import { ApexOptions } from 'apexcharts';

import DatePicker from "react-datepicker";
import moment from 'moment';

import "react-datepicker/dist/react-datepicker.css";
import { start } from 'repl';

enum PeriodType {
    Week = "Week",
    Month = "Month",
    Year = "Year",
};

const MyDatePicker: React.FC<{ mode: PeriodType, date: Date, setDate: (_: Date) => void }> = ({ mode, date, setDate }) => {
    const settings: any = {};
    switch (mode) {
        case PeriodType.Week:
            settings["dateFormat"]= "DD/MM/yyyy"
            settings["showWeekNumbers"] = true;
            settings["showWeekPicker"] = true;
            break;
        case PeriodType.Month:
            settings["dateFormat"]= "MM/yyyy"
            settings["showMonthYearPicker"] = true;
            break;
        case PeriodType.Year:
            settings["dateFormat"]= "yyyy"
            settings["showYearPicker"] = true;
            break;
    };
    return (
        <DatePicker selected={date} onChange={setDate} {...settings} />
    );
};

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

function formatDate(date: MyDate): string {
    return `${date.year}/${date.month}/${date.day}`;
}

function toMoment(date: MyDate): moment.Moment {
    return moment(formatDate(date), 'YYYY/MM/DD');
}

function fromMoment(m: moment.Moment): MyDate {
    return { year: m.year(), month: m.month() + 1, day: m.date() };
}

function spanNext(date: MyDate, period: PeriodType): MyDate {
    console.debug(toMoment(date));
    console.debug(toMoment(date).add(1, period.toLowerCase() as moment.DurationInputArg2));
    const out = fromMoment(toMoment(date).add(1, period.toLowerCase() as moment.DurationInputArg2));
    console.debug(out);
    return fromMoment(toMoment(date).add(1, period.toLowerCase() as moment.DurationInputArg2));
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
    children?: React.ReactNode;
}> = (props): React.JSX.Element => {
    const className = ["px-4 py-2 rounded-md shadow", props.selected ? 'mod-cta' : null, "transition duration-300 ease-in-out transform hover:scale-105"]
        .filter((n) => n)
        .join(' ');
    // const className = props.selected ? "mod-cta" : null;
    return (
        <button className={className} onClick={props.action}>
            {props.children}
        </button>
    );
};

const Picker: React.FC<{
    options: string[];
    selectedOption: string;
    onSelect: (option: string) => void;
}> = ({ options, selectedOption, onSelect }) => {
    return (
        <div className="inline-flex rounded-md shadow border" role="group">
            {options.map((option, index) => (
                <React.Fragment key={option}>
                    <button type="button" onClick={() => onSelect(option)} className={`px-4 py-2 ${(index === 0) ? "rounded-r-none" : (index === options.length - 1) ? "rounded-l-none" : "rounded-none"} transition duration-300 ease-in-out ${(option === selectedOption) ? "mod-cta" : ""}`} style={{ boxShadow: "none" }}>
                        {option}
                    </button>
                    {index < options.length - 1 && <div className="w-px bg-gray-300"></div>}
                </React.Fragment>
            ))}
        </div>
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
            formatter: expenseSummaries.length === 0 ? (_1: any, _2: any) => "no data" : dollarFormatter,
            style: {
                fontSize: '13px',
                fontWeight: 450
            },
        },
        plotOptions: {
            bar: {
                horizontal: false,
                borderRadius: 10,
                borderRadiusApplication: 'end', // 'around', 'end'
                borderRadiusWhenStacked: 'last', // 'all', 'last'
                dataLabels: {
                    position: 'center',
                    total: {
                        enabled: true,
                        style: {
                            fontSize: '13px',
                            fontWeight: 450
                        },
                    },
                }
            },
        },
        xaxis: {
            categories: stack_categories ? categories : accounts,
        },
        yaxis: {
            labels: { formatter: expenseSummaries.length === 0 ? (_1: any, _2: any) => "no data" : dollarFormatter }, // two decimal points
        },
        fill: {
            opacity: 1
        }
    };

    if (series.length === 0) {
        series.push({ name: "", data: [] });
    }
    
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
    const [period, setPeriod] = useState<PeriodType>(PeriodType.Month);
    const [startDate, setStartDate] = useState<MyDate>(fromMoment(moment().startOf(period.toLowerCase() as moment.unitOfTime.StartOf)));

    useEffect(() => {
        async function getOutput() {
            const startDateString = formatDate(startDate);
            console.debug("Getting output for date: ", startDateString);
            const endDateString = formatDate(spanNext(startDate, period));
            const rawOutput = await invoke_ledger(exePath, filePath, ['bal', "^Expenses", "--period", `'from ${startDateString} to ${endDateString}'`, "--format", "\"%(account),%(amount)\\n\"", "--flat", "--basis"]);
            const expenses = parseLedgerOutput(rawOutput);
            console.debug("Parsed expenses: ", JSON.stringify(expenses));
            setOutput(expenses);
        }
        getOutput();
    }, [startDate]);

    return <div>
        <div className="flex space-x-2 mb-4 justify-end">
            <MyDatePicker mode={period} date={toMoment(startDate).toDate()} setDate={(date: Date) => {setStartDate(fromMoment(moment(date)))}} />
            <Picker
                options={['Week', 'Month', 'Year']}
                selectedOption={period}
                onSelect={(newPeriod: string) => {setPeriod(newPeriod as PeriodType); setStartDate(fromMoment(toMoment(startDate).startOf(newPeriod.toLowerCase() as moment.unitOfTime.StartOf)))}}
            />
        </div>
        {ApexChart(output)}
    </div>
};

export { Dashboard };
