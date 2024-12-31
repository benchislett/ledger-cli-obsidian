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

function dollarFormatter(n: number, _?: any): string {
    return "$" + n.toFixed(2);
}

function dollarStrFormatter(s: string): string {
    return "$" + Number.parseFloat(s).toFixed(2);
}

const ApexChart = (expenseSummaries: ExpenseSummary[], bar: boolean, collectBottomLevel: boolean) => {
    const height = 520;
    let series: any = [];
    let options: any = {};
    let categories: string[] = [];
    let categoryForAccount: { [account: string]: string } = {};
    let i = 0;
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
                labels: { formatter: (s: string) => s.split(':').slice(-1)[0]}
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
                width: 380,
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

interface DashboardProps {
    exePath: string;
    filePath: string;
}

const Dashboard: React.FC<DashboardProps> = ({ exePath, filePath }) => {
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

    // skeleton layout with flex grid, two rows, one with two div containers and one with three.
    return <div className="min-h-screen bg-gray-50 p-4">
        {/* First row - two cards */}
        <div className="flex gap-4 mb-4">
            <div className="flex-1 bg-white rounded-lg shadow-md p-6">
                {/* First card content */}
                <div className="h-64">Card 1</div>
            </div>

            <div className="flex-1 bg-white rounded-lg shadow-md p-6">
                {/* Second card content */}
                <div className="h-64">Card 2</div>
            </div>
        </div>

        {/* Second row - three cards */}
        <div className="flex gap-4">
            <div className="basis-[30%] bg-white rounded-lg shadow-md p-6">
                {/* Third card content */}
                <div className="h-48">Card 3</div>
            </div>

            {/* <div className="flex-1 bg-white rounded-lg shadow-md p-6">
                <div className="h-48">Card 4</div>
            </div> */}

            <div className="basis-[70%] bg-white rounded-lg shadow-md p-6">
                <div>
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
                        {ApexChart(output, barChart, collectBottomLevel)}
                    </div>
                </div>
            </div>
        </div>
    </div>
    // return <div>
    //     <div className="flex space-x-2 mb-4 justify-end align-center">
    //         <MyDatePicker mode={period} date={toMoment(startDate).toDate()} setDate={(date: Date) => { setStartDate(fromMoment(moment(date))) }} />
    //         <MultiButton
    //             options={['Week', 'Month', 'Year']}
    //             selectedOption={period}
    //             onSelect={(newPeriod: string) => { setPeriod(newPeriod as PeriodType); setStartDate(fromMoment(toMoment(startDate).startOf(newPeriod.toLowerCase() as moment.unitOfTime.StartOf))) }}
    //         />
    //         <SettingsButton options={settingsButtonOptions} />
    //     </div>
    //     <div key={chartKey}>
    //         {ApexChart(output, barChart, collectBottomLevel)}
    //     </div>
    // </div>
};

export { Dashboard };
