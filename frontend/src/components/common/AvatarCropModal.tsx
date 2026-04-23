// ---------------------------------------------------------------------------
// components/common/AvatarCropModal.tsx — Sprint 7 polish b5
//
// Modal crop avatar stile WhatsApp / Instagram: immagine con maschera
// circolare centrale, controlli zoom (1×–3×) e pan drag. Ritorna un Blob
// PNG del ritaglio quadrato (1:1) che poi l'upload handler invia al backend.
// ---------------------------------------------------------------------------
import { useCallback, useState } from 'react';

import { Button, Modal, Slider, Space, Typography } from 'antd';
import { RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';

interface AvatarCropModalProps {
  open: boolean;
  /** File selezionato dall'utente (qualsiasi formato immagine). */
  file: File | null;
  /** Lato output in px (default 512, allineato al max del backend). */
  outputSize?: number;
  onCancel: () => void;
  /** Riceve il Blob del ritaglio (PNG) pronto per upload. */
  onConfirm: (croppedBlob: Blob) => void;
  loading?: boolean;
}

export default function AvatarCropModal({
  open,
  file,
  outputSize = 512,
  onCancel,
  onConfirm,
  loading = false,
}: AvatarCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);

  const imageSrc = file ? URL.createObjectURL(file) : '';

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!file || !croppedArea) return;
    const blob = await cropImageToBlob(imageSrc, croppedArea, rotation, outputSize);
    onConfirm(blob);
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  return (
    <Modal
      open={open}
      onCancel={() => {
        handleReset();
        onCancel();
      }}
      title="Ritaglia la tua foto profilo"
      width={520}
      destroyOnClose
      afterClose={handleReset}
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={loading}>
          Annulla
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={handleConfirm}
          disabled={!croppedArea}
          loading={loading}
        >
          Salva avatar
        </Button>,
      ]}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 340,
          background: '#0b0d18',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {file && (
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: { background: '#0b0d18' },
            }}
          />
        )}
      </div>

      <div style={{ marginTop: 18 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 4 }}>
          <Typography.Text style={{ fontSize: 12, color: '#595959' }}>Zoom</Typography.Text>
          <Typography.Text
            style={{ fontSize: 11, color: '#8c8c8c', fontVariantNumeric: 'tabular-nums' }}
          >
            {zoom.toFixed(1)}×
          </Typography.Text>
        </Space>
        <Space style={{ width: '100%' }} align="center">
          <ZoomOut size={14} color="#8c8c8c" aria-hidden="true" />
          <Slider
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={setZoom}
            style={{ flex: 1, minWidth: 240 }}
            tooltip={{ open: false }}
          />
          <ZoomIn size={14} color="#8c8c8c" aria-hidden="true" />
        </Space>
      </div>

      <div
        style={{
          marginTop: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Trascina l'immagine per centrare il viso, usa la rotella o il pinch per lo zoom.
        </Typography.Text>
        <Button
          size="small"
          type="text"
          icon={<RotateCw size={13} />}
          onClick={() => setRotation((r) => (r + 90) % 360)}
        >
          Ruota 90°
        </Button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Helpers: carica l'immagine + ritaglia su canvas → Blob PNG.
// ---------------------------------------------------------------------------

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', (err) => reject(err));
    img.src = src;
  });
}

async function cropImageToBlob(
  imageSrc: string,
  pixelCrop: Area,
  rotation: number,
  outputSize: number,
): Promise<Blob> {
  const img = await loadImage(imageSrc);

  // Canvas 1: rotazione (se != 0) su buffer che contiene l'intera immagine.
  const rad = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));

  const rotW = img.width * cos + img.height * sin;
  const rotH = img.width * sin + img.height * cos;

  const rotated = document.createElement('canvas');
  rotated.width = rotW;
  rotated.height = rotH;
  const rctx = rotated.getContext('2d');
  if (!rctx) throw new Error('Canvas 2D context non disponibile');

  rctx.translate(rotW / 2, rotH / 2);
  rctx.rotate(rad);
  rctx.drawImage(img, -img.width / 2, -img.height / 2);

  // Canvas 2: estrazione del crop rettangolare + resize a outputSize quadrato.
  const out = document.createElement('canvas');
  out.width = outputSize;
  out.height = outputSize;
  const octx = out.getContext('2d');
  if (!octx) throw new Error('Canvas 2D context non disponibile');

  octx.drawImage(
    rotated,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize,
  );

  return new Promise<Blob>((resolve, reject) => {
    out.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob ritorna null'))),
      'image/png',
      0.95,
    );
  });
}
