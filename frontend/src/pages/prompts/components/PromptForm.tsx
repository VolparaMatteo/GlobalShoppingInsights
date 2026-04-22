// ---------------------------------------------------------------------------
// PromptForm.tsx  --  Create / Edit / View form for a search prompt
// ---------------------------------------------------------------------------
import { useEffect } from 'react';
import {
  Button,
  Card,
  Divider,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  TreeSelect,
  Typography,
} from 'antd';

import { TIME_DEPTH_OPTIONS } from '@/config/constants';
import { usePromptFolders } from '@/hooks/queries/usePromptFolders';
import type { Prompt, PromptCreate, PromptUpdate, PromptFolder } from '@/types';

const { TextArea } = Input;
const { Text } = Typography;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'Inglese' },
  { value: 'es', label: 'Spagnolo' },
  { value: 'fr', label: 'Francese' },
  { value: 'de', label: 'Tedesco' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Portoghese' },
  { value: 'nl', label: 'Olandese' },
  { value: 'ja', label: 'Giapponese' },
  { value: 'zh', label: 'Cinese' },
  { value: 'ko', label: 'Coreano' },
  { value: 'ar', label: 'Arabo' },
  { value: 'ru', label: 'Russo' },
];

const COUNTRY_OPTIONS = [
  { value: 'US', label: 'Stati Uniti' },
  { value: 'GB', label: 'Regno Unito' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germania' },
  { value: 'FR', label: 'Francia' },
  { value: 'ES', label: 'Spagna' },
  { value: 'IT', label: 'Italia' },
  { value: 'JP', label: 'Giappone' },
  { value: 'CN', label: 'Cina' },
  { value: 'KR', label: 'Corea del Sud' },
  { value: 'BR', label: 'Brasile' },
  { value: 'IN', label: 'India' },
  { value: 'MX', label: 'Messico' },
  { value: 'NL', label: 'Paesi Bassi' },
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
  folder_id: number | null;
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
// Helper: build treeData for TreeSelect from nested PromptFolder[]
// ---------------------------------------------------------------------------

function buildTreeSelectData(
  folders: PromptFolder[],
): { value: number; title: string; children?: ReturnType<typeof buildTreeSelectData> }[] {
  return folders.map((f) => ({
    value: f.id,
    title: f.name,
    children: f.children.length > 0 ? buildTreeSelectData(f.children) : undefined,
  }));
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
  const { data: folders } = usePromptFolders();

  // Populate form when initialValues change
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        title: initialValues.title ?? '',
        folder_id: initialValues.folder_id ?? null,
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
      folder_id: values.folder_id || null,
      description: values.description || null,
      keywords: values.keywords,
      excluded_keywords: values.excluded_keywords,
      language: values.language || null,
      countries: values.countries,
      time_depth: values.time_depth,
      max_results: values.max_results,
      schedule_enabled: values.schedule_enabled,
      schedule_frequency_hours: values.schedule_enabled ? values.schedule_frequency_hours : null,
      schedule_specific_times: values.schedule_enabled
        ? values.schedule_specific_times?.length
          ? values.schedule_specific_times
          : null
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
      style={{ maxWidth: 680 }}
      initialValues={{
        title: '',
        folder_id: null,
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
        label="Titolo"
        rules={[{ required: true, message: 'Inserisci un titolo per il prompt' }]}
      >
        <Input placeholder="es. AI nel retail, In-store experience" maxLength={200} />
      </Form.Item>

      <Form.Item name="folder_id" label="Cartella">
        <TreeSelect
          placeholder="Seleziona una cartella (opzionale)"
          allowClear
          treeDefaultExpandAll
          treeData={folders ? buildTreeSelectData(folders) : []}
        />
      </Form.Item>

      <Form.Item
        name="description"
        label="Prompt"
        tooltip="Descrivi ciò che stai cercando in linguaggio naturale. Verrà usato come query di ricerca e per il punteggio di rilevanza AI."
        rules={[{ required: true, message: 'Inserisci un prompt di ricerca' }]}
      >
        <TextArea
          rows={3}
          placeholder='es. "Intelligenza artificiale nel mondo del retail" oppure "Best in-store customer experiences"'
          maxLength={1000}
        />
      </Form.Item>

      <Form.Item
        name="keywords"
        label="Parole Chiave (opzionale)"
        tooltip="Parole chiave aggiuntive per affinare i risultati. Lascia vuoto per basarti solo sul testo del prompt."
      >
        <Select
          mode="tags"
          placeholder="Digita le parole chiave e premi Invio"
          tokenSeparators={[',']}
        />
      </Form.Item>

      <Form.Item name="excluded_keywords" label="Parole Chiave Escluse">
        <Select
          mode="tags"
          placeholder="Parole chiave da escludere dai risultati"
          tokenSeparators={[',']}
        />
      </Form.Item>

      <Form.Item name="language" label="Lingua">
        <Select placeholder="Seleziona lingua" allowClear options={LANGUAGE_OPTIONS} />
      </Form.Item>

      <Form.Item name="countries" label="Paesi">
        <Select
          mode="multiple"
          placeholder="Seleziona i paesi di destinazione"
          allowClear
          options={COUNTRY_OPTIONS}
        />
      </Form.Item>

      <Form.Item name="time_depth" label="Arco Temporale">
        <Select
          options={TIME_DEPTH_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
        />
      </Form.Item>

      <Form.Item name="max_results" label="Risultati Massimi">
        <InputNumber min={1} max={200} style={{ width: '100%' }} />
      </Form.Item>

      {/* ----- Schedule section -------------------------------------------- */}

      <Card
        size="small"
        style={{ marginTop: 8, background: '#fafafa', border: '1px solid #f0f0f0' }}
      >
        <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 12 }}>
          Pianificazione
        </Text>

        <Form.Item
          name="schedule_enabled"
          label="Abilita Pianificazione"
          valuePropName="checked"
          style={{ marginBottom: scheduleEnabled ? 16 : 0 }}
        >
          <Switch />
        </Form.Item>

        {scheduleEnabled && (
          <>
            <Form.Item name="schedule_frequency_hours" label="Frequenza (ore)">
              <InputNumber min={1} max={720} placeholder="es. 24" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="schedule_specific_times"
              label="Orari di Esecuzione"
              tooltip="Inserisci orari in formato HH:mm (es. 09:00, 14:30)"
              style={{ marginBottom: 0 }}
            >
              <Select
                mode="tags"
                placeholder="es. 09:00, 14:30, 18:00"
                tokenSeparators={[',']}
                disabled={isViewMode}
              />
            </Form.Item>
          </>
        )}
      </Card>

      {/* ----- Action buttons ---------------------------------------------- */}

      {!isViewMode && (
        <>
          <Divider />
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {mode === 'create' ? 'Crea Prompt' : 'Salva Modifiche'}
            </Button>
            {onCancel && (
              <Button onClick={onCancel} disabled={loading}>
                Annulla
              </Button>
            )}
          </Space>
        </>
      )}
    </Form>
  );
}
