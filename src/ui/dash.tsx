import React from 'react';
import { useState, useEffect } from 'react';

import ReactApexChart from 'react-apexcharts';

import { MultiButton } from './buttons';

import { ApexOptions } from 'apexcharts';

import moment from 'moment';

import "react-datepicker/dist/react-datepicker.css";

import { SettingsButton } from './settingsDropdown';

import { MyDate, formatDate, fromMoment, spanNext, toMoment } from '../date';

import { PeriodType, MyDatePicker } from './datePicker';

import { ExpenseSummary, query_balance_range } from 'src/query_ledger';

function dollarFormatter(n: number | string, _?: any): string {
    if (typeof n === "string") {
        return "$" + Number.parseFloat(n).toFixed(2);
    } else {
        return "$" + n.toFixed(2);
    }
}

const ExpenseChart = (expenseSummaries: ExpenseSummary[], bar: boolean, collectBottomLevel: boolean) => {
    const height = 480;
    let series: any = [];
    let options: any = {};
    let categories: string[] = [];
    let categoryForAccount: { [account: string]: string } = {};
    for (const expense of expenseSummaries) {
        let category = expense.account.split(':').slice(0, 2).join(':');
        if (collectBottomLevel && category == expense.account) {
            category = "Expenses:Other";
        }
        if (!categories.includes(category)) {
            categories.push(category);
        }
        categoryForAccount[expense.account] = category;
    }

    if (bar) {
        for (const expense of expenseSummaries) {
            let subseries = Array.from({ length: categories.length }, () => 0);
            const index = categories.indexOf(categoryForAccount[expense.account]);
            subseries[index] = expense.amount;
            series.push({ name: expense.account, data: subseries });
        }

        options = {
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
                categories,
                labels: { formatter: (s: string) => s.split(':').slice(-1)[0] }
            },
            yaxis: {
                labels: { formatter: expenseSummaries.length === 0 ? (_1: any, _2: any) => "no data" : dollarFormatter }, // two decimal points
            },
            legend: {
                formatter: (s: string) => s.split(':').slice(-1)[0]
            },
            fill: {
                opacity: 1
            }
        };
    } else {
        series = Array.from({ length: categories.length }, () => 0);
        for (const expense of expenseSummaries) {
            const index = categories.indexOf(categoryForAccount[expense.account]);
            series[index] += expense.amount;
        }

        options = {
            series: series,
            chart: {
                type: 'pie',
            },
            labels: categories,
            tooltip: {
                y: {
                    formatter: dollarFormatter,
                }
            }
        };
    }

    if (series.length === 0) {
        if (bar) {
            series.push({ name: "", data: [] });
        }
    }

    console.debug(options, series);

    return (
        <div>
            <div id="chart">
                <ReactApexChart options={options as ApexOptions} series={series} type={bar ? "bar" : "pie"} height={height} />
            </div>
            <div id="html-dist"></div>
        </div>
    );
}

const MultiExpenseChart = (expenseSummarySets: ExpenseSummary[][], collectBottomLevel: boolean) => {
    const height = 300;
    let series: any = [];
    let options: any = {};
    let categories: string[] = [];
    let categoryForAccount: { [account: string]: string } = {};
    for (const expenseSummaries of expenseSummarySets) {
        for (const expense of expenseSummaries) {
            let category = expense.account.split(':').slice(0, 2).join(':');
            if (collectBottomLevel && category == expense.account) {
                category = "Expenses:Other";
            } else if (!collectBottomLevel) {
                category = expense.account;
            }
            if (!categories.includes(category)) {
                categories.push(category);
            }
            categoryForAccount[expense.account] = category;
        }
    }

    let dateNames = Array.from({ length: expenseSummarySets.length }, (_, i) => `2024/${i + 1}/01`);

    while (expenseSummarySets.length > 0 && expenseSummarySets[0].length === 0) {
        expenseSummarySets.shift();
        dateNames.shift();
    }

    for (const category of categories) {
        series.push({ name: category, data: Array.from({ length: expenseSummarySets.length }, () => 0) });
    }


    let i = 0;
    for (const expenseSummaries of expenseSummarySets) {
        for (const expense of expenseSummaries) {
            const index = categories.indexOf(categoryForAccount[expense.account]);
            series[index]["data"][i] += expense.amount;
        }
        i++;
    }

    options = {
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
            formatter: expenseSummarySets.length === 0 ? (_1: any, _2: any) => "no data" : dollarFormatter,
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
            categories: dateNames,
            // labels: { formatter: (s: string) => s.split(':').slice(-1)[0] }
        },
        yaxis: {
            labels: { formatter: expenseSummarySets.length === 0 ? (_1: any, _2: any) => "no data" : dollarFormatter }, // two decimal points
        },
        legend: {
            formatter: (s: string) => s.split(':').slice(-1)[0]
        },
        fill: {
            opacity: 1
        }
    };

    if (series.length === 0) {
        series.push({ name: "", data: [] });
    }

    console.debug(options, series);

    return (
        <div>
            <div id="chart">
                <ReactApexChart options={options as ApexOptions} series={series} type={"bar"} height={height} />
            </div>
            <div id="html-dist"></div>
        </div>
    );
}

interface DashboardProps {
    exePath: string;
    filePath: string;
}

const SingleExpenseChart: React.FC<DashboardProps> = ({ exePath, filePath }) => {
    const [output, setOutput] = useState<ExpenseSummary[]>([]);
    const [period, setPeriod] = useState<PeriodType>(PeriodType.Month);
    const [startDate, setStartDate] = useState<MyDate>(fromMoment(moment().startOf(period.toLowerCase() as moment.unitOfTime.StartOf)));
    const [collectBottomLevel, setCollectBottomLevel] = useState<boolean>(false);
    const [barChart, setBarChart] = useState<boolean>(true);
    const [chartKey, setChartKey] = useState<number>(0);

    const settingsButtonOptions = {
        collectBottomLevel: {
            label: "Collect Bottom Level Accounts",
            enabled: collectBottomLevel,
            onChange: (enabled: boolean) => setCollectBottomLevel(enabled),
        },
        barChart: {
            label: "Bar Chart",
            enabled: barChart,
            onChange: (enabled: boolean) => { setBarChart(enabled); setChartKey(chartKey + 1); },
        },
    };

    useEffect(() => {
        async function getOutput() {
            const startDateString = formatDate(startDate);
            console.debug("Getting output for date: ", startDateString);
            const endDateString = formatDate(spanNext(startDate, period));
            const expenses = await query_balance_range(exePath, filePath, startDateString, endDateString);
            console.debug("Parsed expenses: ", JSON.stringify(expenses));
            setOutput(expenses.filter((expense: ExpenseSummary) => expense.account.startsWith("Expenses:")));
        }
        getOutput();
    }, [startDate]);

    return <div>
        <div className="flex space-x-2 mb-4 justify-end align-center">
            <MyDatePicker mode={period} date={toMoment(startDate).toDate()} setDate={(date: Date) => { setStartDate(fromMoment(moment(date))) }} />
            <MultiButton
                options={['Week', 'Month', 'Year']}
                selectedOption={period}
                onSelect={(newPeriod: string) => { setPeriod(newPeriod as PeriodType); setStartDate(fromMoment(toMoment(startDate).startOf(newPeriod.toLowerCase() as moment.unitOfTime.StartOf))) }}
            />
            <SettingsButton options={settingsButtonOptions} />
        </div>
        <div key={chartKey}>
            {ExpenseChart(output, barChart, collectBottomLevel)}
        </div>
    </div>;
};

const MonthlyExpenseChart: React.FC<DashboardProps> = ({ exePath, filePath }) => {
    const [output, setOutput] = useState<ExpenseSummary[][]>([]);

    useEffect(() => {
        async function getOutput() {
            const promises = [];
            let date: MyDate = { year: 2024, month: 1, day: 1 };
            for (let i = 0; i < 12; i++) {
                const next = spanNext(date, PeriodType.Month);
                promises.push(query_balance_range(exePath, filePath, formatDate(date), formatDate(next)));
                date = next;
            }
            const allOutputs = await Promise.all(promises);
            setOutput(allOutputs.map((expenses: ExpenseSummary[]) => expenses.filter((expense: ExpenseSummary) => expense.account.startsWith("Expenses:"))));
        }
        getOutput();
    }, []);

    return <div>
        {MultiExpenseChart(output, false)}
    </div>;
};

const NetWorthLineChart: React.FC<{ output: number[] }> = ({ output }) => {
    const dateNames = Array.from({ length: 12 }, (_, i) => `2024/${i + 1}/01`);
    while (output.length > 0 && output[0] === 0) {
        output.shift();
        dateNames.shift();
    }

    const height = 300;
    const series = [{ name: "Net Worth", data: output }];
    const options = {
        chart: {
            type: 'area',
            height: height,
            zoom: {
                enabled: false
            }
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'straight'
        },
        title: {
            text: 'Net Worth',
            align: 'left'
        },
        labels: dateNames,
        xaxis: {
            type: 'datetime',
        },
        yaxis: {
            labels: {
                formatter: dollarFormatter
            }
        },
    };

    return <div>
        <div id="chart">
            <ReactApexChart options={options as ApexOptions} series={series} type={"area"} height={height} />
        </div>
        <div id="html-dist"></div>
    </div>
};

const NetWorthChart: React.FC<DashboardProps> = ({ exePath, filePath }) => {
    const [output, setOutput] = useState<number[]>([]);

    useEffect(() => {
        async function getOutput() {
            const promises = [];
            let date: MyDate = { year: 2024, month: 1, day: 1 };
            let next = date;
            for (let i = 0; i < 12; i++) {
                next = spanNext(next, PeriodType.Month);
                promises.push(query_balance_range(exePath, filePath, formatDate(date), formatDate(next)));
            }
            const allOutputs = await Promise.all(promises);
            console.debug("All outputs: ", allOutputs);
            setOutput(allOutputs.map((expenses: ExpenseSummary[]) => expenses.filter((expense: ExpenseSummary) => expense.account.startsWith("Assets:") || expense.account.startsWith("Liabilities:")).reduce((acc: number, expense: ExpenseSummary) => acc + expense.amount, 0)));
        }
        getOutput();
    }, []);

    return <div>
        {<NetWorthLineChart output={output} />}
    </div>;
};

const Dashboard: React.FC<DashboardProps> = ({ exePath, filePath }) => {
    // skeleton layout with flex grid, two rows, one with two div containers and one with three.
    return <div className="min-h-screen bg-gray-50 p-4">
        <div className="flex gap-4 mb-4">
            <div className="basis-[30%] bg-white rounded-lg shadow-md p-6">
                <div className="h-48">Card 3</div>
            </div>

            <div className="basis-[70%] bg-white rounded-lg shadow-md p-6">
                <SingleExpenseChart exePath={exePath} filePath={filePath} />
            </div>
        </div>

        <div className="flex gap-4">
            <div className="flex-1 bg-white rounded-lg shadow-md p-6">
                <NetWorthChart exePath={exePath} filePath={filePath} />
            </div>

            <div className='flex-1 bg-white rounded-lg shadow-md p-6'>
            X
            </div>
        </div>
    </div>
};

export { Dashboard };
