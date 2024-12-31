import { PeriodType } from './ui/datePicker';
import moment from 'moment';

interface MyDate {
    year: number;
    month: number;
    day: number;
}

function currentDate() {
    return fromMoment(moment());
}

function formatDate(date: MyDate, period?: PeriodType): string {
    if (period == PeriodType.Month) {
        return `${date.year}/${date.month}`;
    } else if (period == PeriodType.Year) {
        return `${date.year}`;
    }

    return `${date.year}/${date.month}/${date.day}`;
}

function toMoment(date: MyDate): moment.Moment {
    return moment(formatDate(date), 'YYYY/MM/DD');
}

function fromMoment(m: moment.Moment): MyDate {
    return { year: m.year(), month: m.month() + 1, day: m.date() };
}

function spanStart(date: MyDate, period: PeriodType): MyDate {
    return fromMoment(toMoment(date).startOf(period.toLowerCase() as moment.unitOfTime.StartOf));
}

function spanEnd(date: MyDate, period: PeriodType): MyDate {
    return fromMoment(toMoment(date).endOf(period.toLowerCase() as moment.unitOfTime.StartOf));
}

function spanNext(date: MyDate, period: PeriodType): MyDate {
    return fromMoment(toMoment(date).add(1, period.toLowerCase() as moment.DurationInputArg2));
}

function spanPrev(date: MyDate, period: PeriodType): MyDate {
    return fromMoment(toMoment(date).subtract(1, period.toLowerCase() as moment.DurationInputArg2));
}

export { formatDate, currentDate, toMoment, fromMoment, spanStart, spanEnd, spanNext, spanPrev };
export type { MyDate };
