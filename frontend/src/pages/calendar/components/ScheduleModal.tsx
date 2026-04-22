// ---------------------------------------------------------------------------
// ScheduleModal.tsx  --  Modale pianificazione / pubblica ora
// ---------------------------------------------------------------------------
import { useState } from 'react';
import { DatePicker, Modal, Select, TimePicker, Typography, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import 'dayjs/locale/it';

import { useCreateSlot } from '@/hooks/queries/useCalendarSlots';
import { usePublishArticle } from '@/hooks/queries/usePublishJobs';

dayjs.locale('it');

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ScheduleModalProps {
  open: boolean;
  onClose: () => void;
  articleId: number;
  articleTitle: string;
  defaultDate: Dayjs;
  defaultTime: Dayjs;
}

// ---------------------------------------------------------------------------
// Timezone options
// ---------------------------------------------------------------------------

const TIMEZONE_OPTIONS = [
  { label: 'Europe/Rome', value: 'Europe/Rome' },
  { label: 'Europe/London', value: 'Europe/London' },
  { label: 'America/New_York', value: 'America/New_York' },
  { label: 'America/Los_Angeles', value: 'America/Los_Angeles' },
  { label: 'Asia/Tokyo', value: 'Asia/Tokyo' },
  { label: 'UTC', value: 'UTC' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ScheduleModal({
  open,
  onClose,
  articleId,
  articleTitle,
  defaultDate,
  defaultTime,
}: ScheduleModalProps) {
  const [date, setDate] = useState<Dayjs>(defaultDate);
  const [time, setTime] = useState<Dayjs>(defaultTime);
  const [timezone, setTimezone] = useState('Europe/Rome');

  const createSlot = useCreateSlot();
  const publishArticle = usePublishArticle();

  const handleSchedule = () => {
    const scheduledFor = date
      .hour(time.hour())
      .minute(time.minute())
      .second(0)
      .format('YYYY-MM-DDTHH:mm:ss');

    createSlot.mutate(
      { article_id: articleId, scheduled_for: scheduledFor, timezone },
      {
        onSuccess: () => {
          message.success('Articolo pianificato con successo');
          onClose();
        },
        onError: () => {
          message.error('Errore nella pianificazione');
        },
      },
    );
  };

  const handlePublishNow = () => {
    publishArticle.mutate(articleId, {
      onSuccess: () => {
        message.success('Pubblicazione avviata');
        onClose();
      },
      onError: () => {
        message.error('Errore nella pubblicazione');
      },
    });
  };

  const isLoading = createSlot.isPending || publishArticle.isPending;

  return (
    <Modal
      open={open}
      title="Pianifica articolo"
      onCancel={onClose}
      destroyOnClose
      okText="Pianifica"
      okButtonProps={{ loading: createSlot.isPending, disabled: isLoading }}
      onOk={handleSchedule}
      cancelButtonProps={{ style: { display: 'none' } }}
      footer={(_, { OkBtn }) => (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            type="button"
            className="ant-btn ant-btn-default"
            disabled={isLoading}
            onClick={handlePublishNow}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <SendOutlined />
            {publishArticle.isPending ? 'Pubblicando...' : 'Pubblica ora'}
          </button>
          <OkBtn />
        </div>
      )}
    >
      <div style={{ marginBottom: 16 }}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          ARTICOLO
        </Typography.Text>
        <Typography.Paragraph strong style={{ margin: '4px 0 0' }}>
          {articleTitle}
        </Typography.Paragraph>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <Typography.Text
            type="secondary"
            style={{ fontSize: 12, display: 'block', marginBottom: 4 }}
          >
            Data
          </Typography.Text>
          <DatePicker
            value={date}
            onChange={(d) => d && setDate(d)}
            format="DD/MM/YYYY"
            style={{ width: '100%' }}
            allowClear={false}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Typography.Text
            type="secondary"
            style={{ fontSize: 12, display: 'block', marginBottom: 4 }}
          >
            Ora
          </Typography.Text>
          <TimePicker
            value={time}
            onChange={(t) => t && setTime(t)}
            format="HH:mm"
            minuteStep={15}
            style={{ width: '100%' }}
            allowClear={false}
          />
        </div>
      </div>

      <div>
        <Typography.Text
          type="secondary"
          style={{ fontSize: 12, display: 'block', marginBottom: 4 }}
        >
          Fuso orario
        </Typography.Text>
        <Select
          value={timezone}
          onChange={setTimezone}
          options={TIMEZONE_OPTIONS}
          style={{ width: '100%' }}
        />
      </div>
    </Modal>
  );
}
