import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/it';
import { Tooltip } from 'antd';

dayjs.extend(relativeTime);
dayjs.locale('it');

interface RelativeTimeProps {
  date: string | Date;
}

export default function RelativeTime({ date }: RelativeTimeProps) {
  const d = dayjs(date);
  return (
    <Tooltip title={d.format('YYYY-MM-DD HH:mm:ss')}>
      <span>{d.fromNow()}</span>
    </Tooltip>
  );
}
