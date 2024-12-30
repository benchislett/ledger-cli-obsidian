import { PeriodType } from './ui/datePicker';
import moment from 'moment';

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

export { formatDate, toMoment, fromMoment, spanNext };
export type { MyDate };