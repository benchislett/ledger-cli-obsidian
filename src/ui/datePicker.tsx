import React from 'react';

import DatePicker from "react-datepicker";

enum PeriodType {
    Week = "Week",
    Month = "Month",
    Year = "Year",
};

const MyDatePicker: React.FC<{ mode: PeriodType, date: Date, setDate: (_: Date) => void }> = ({ mode, date, setDate }) => {
    const settings: any = {};
    switch (mode) {
        case PeriodType.Week:
            settings["dateFormat"] = "dd MMM, yyyy"
            settings["showWeekNumbers"] = true;
            settings["showWeekPicker"] = true;
            break;
        case PeriodType.Month:
            settings["dateFormat"] = "MMM yyyy"
            settings["showMonthYearPicker"] = true;
            break;
        case PeriodType.Year:
            settings["dateFormat"] = "yyyy"
            settings["showYearPicker"] = true;
            break;
    };
    return (
        <DatePicker selected={date} onChange={setDate} {...settings} />
    );
};

export { MyDatePicker, PeriodType };