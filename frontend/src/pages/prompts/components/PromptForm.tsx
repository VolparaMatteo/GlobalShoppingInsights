// ---------------------------------------------------------------------------
// PromptForm.tsx  --  Create / Edit / View form for a search prompt
// ---------------------------------------------------------------------------
import { useEffect } from 'react';
import {
  Button,
  Divider,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Typography,
} from 'antd';

import { TIME_DEPTH_OPTIONS } from '@/config/constants';
import type { Prompt, PromptCreate, PromptUpdate } from '@/types';

const { TextArea } = Input;
const { Title } = Typography;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'nl', label: 'Dutch' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ko', label: 'Korean' },
  { value: 'ar', label: 'Arabic' },
  { value: 'ru', label: 'Russian' },
];

const COUNTRY_OPTIONS = [
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'ES', label: 'Spain' },
  { value: 'IT', label: 'Italy' },
  { value: 'JP', label: 'Japan' },
  { value: 'CN', label: 'China' },
  { value: 'KR', label: 'South Korea' },
  { value: 'BR', label: 'Brazil' },
  { value: 'IN', label: 'India' },
  { value: 'MX', label: 'Mexico' },
  { value: 'NL', label: 'Netherlands' },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FormMode = 'create' | 'edit' | 'view';

interface PromptFormProps {
  initialValues?: Partial<Prompt>;
  onSubmit: (values: PromptCreate | PromptUpdate) => void;
  onCancel?: () => void;
  loading?: boolean;
  mode: FormMode;
}

/** Internal form values matching the form field structure. */
interface FormValues {
  title: string;
  description: string | null;
  keywords: string[];
  excluded_keywords: string[];
  language: string | null;
  countries: string[];
  time_depth: string;
  max_results: number;
  schedule_enabled: boolean;
  schedule_frequency_hours: number | null;
  schedule_specific_times: string[] | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PromptForm({
  initialValues,
  onSubmit,
  onCancel,
  loading = false,
  mode,
}: PromptFormProps) {
  const [form] = Form.useForm<FormValues>();
  const isViewMode = mode === 'view';
  const scheduleEnabled = Form.useWatch('schedule_enabled', form);

  // Populate form when initialValues change
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        title: initialValues.title ?? '',
        description: initialValues.description ?? null,
        keywords: initialValues.keywords ?? [],
        excluded_keywords: initialValues.excluded_keywords ?? [],
        language: initialValues.language ?? null,
        countries: initialValues.countries ?? [],
        time_depth: initialValues.time_depth ?? '7d',
        max_results: initialValues.max_results ?? 20,
        schedule_enabled: initialValues.schedule_enabled ?? false,
        schedule_frequency_hours: initialValues.schedule_frequency_hours ?? null,
        schedule_specific_times: initialValues.schedule_specific_times ?? [],
      });
    }
  }, [initialValues, form]);

  // ---- Submit handler -----------------------------------------------------

  const handleFinish = (values: FormValues) => {
    const payload: PromptCreate | PromptUpdate = {
      title: values.title,
      description: values.description || null,
      keywords: values.keywords,
      excluded_keywords: values.excluded_keywords,
      language: values.language || null,
      countries: values.countries,
      time_depth: values.time_depth,
      max_results: values.max_results,
      schedule_enabled: values.schedule_enabled,
      schedule_frequency_hours: values.schedule_enabled
        ? values.schedule_frequency_hours
        : null,
      schedule_specific_times: values.schedule_enabled
        ? (values.schedule_specific_times?.length ? values.schedule_specific_times : null)
        : null,
    };
    onSubmit(payload);
  };

  // ---- Render -------------------------------------------------------------

  return (
    <Form<FormValues>
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      disabled={isViewMode}
      initialValues={{
        title: '',
        description: null,
        keywords: [],
        excluded_keywords: [],
        language: null,
        countries: [],
        time_depth: '7d',
        max_results: 20,
        schedule_enabled: false,
        schedule_frequency_hours: null,
        schedule_specific_times: [],
      }}
    >
      {/* ----- Core fields ------------------------------------------------- */}

      <Form.Item
        name="title"
        label="Title"
        rules={[{ required: true, message: 'Please enter a prompt title' }]}
      >
        <Input placeholder="e.g. AI nel retail, In-store experience" maxLength={200} />
      </Form.Item>

      <Form.Item
        name="description"
        label="Prompt"
        tooltip="Describe what you're looking for in natural language. This will be used as the search query and for AI relevance scoring."
        rules={[{ required: true, message: 'Please enter a search prompt' }]}
      >
        <TextArea
          rows={3}
          placeholder='e.g. "Intelligenza artificiale nel mondo del retail" or "Best in-store customer experiences"'
          maxLength={1000}
        />
      </Form.Item>

      <Form.Item
        name="keywords"
        label="Keywords (optional)"
        tooltip="Optional extra keywords to refine results. Leave empty to rely entirely on the prompt text."
      >
        <Select
          mode="tags"
          placeholder="Optional: type keywords and press Enter"
          tokenSeparators={[',']}
        />
      </Form.Item>

      <Form.Item name="excluded_keywords" label="Excluded Keywords">
        <Select
          mode="tags"
          placeholder="Keywords to exclude from results"
          tokenSeparators={[',']}
        />
      </Form.Item>

      <Form.Item name="language" label="Language">
        <Select
          placeholder="Select language"
          allowClear
          options={LANGUAGE_OPTIONS}
        />
      </Form.Item>

      <Form.Item name="countries" label="Countries">
        <Select
          mode="multiple"
          placeholder="Select target countries"
          allowClear
          options={COUNTRY_OPTIONS}
        />
      </Form.Item>

      <Form.Item name="time_depth" label="Time Depth">
        <Select
          options={TIME_DEPTH_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
        />
      </Form.Item>

      <Form.Item name="max_results" label="Max Results">
        <InputNumber min={1} max={200} style={{ width: '100%' }} />
      </Form.Item>

      {/* ----- Schedule section -------------------------------------------- */}

      <Divider />
      <Title level={5} style={{ marginBottom: 16 }}>
        Schedule
      </Title>

      <Form.Item
        name="schedule_enabled"
        label="Enable Schedule"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>

      {scheduleEnabled && (
        <>
          <Form.Item name="schedule_frequency_hours" label="Frequency (hours)">
            <InputNumber
              min={1}
              max={720}
              placeholder="e.g. 24"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="schedule_specific_times"
            label="Specific Run Times"
            tooltip="Enter times in HH:mm format (e.g. 09:00, 14:30)"
          >
            <Select
              mode="tags"
              placeholder="e.g. 09:00, 14:30, 18:00"
              tokenSeparators={[',']}
              disabled={isViewMode}
            />
          </Form.Item>
        </>
      )}

      {/* ----- Action buttons ---------------------------------------------- */}

      {!isViewMode && (
        <>
          <Divider />
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {mode === 'create' ? 'Create Prompt' : 'Save Changes'}
            </Button>
            {onCancel && (
              <Button onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
            )}
          </Space>
        </>
      )}
    </Form>
  );
}
