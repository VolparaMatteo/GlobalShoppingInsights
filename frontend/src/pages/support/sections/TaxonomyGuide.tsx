// ---------------------------------------------------------------------------
// TaxonomyGuide — placeholder (la pagina /taxonomy è in Coming Soon).
// ---------------------------------------------------------------------------
import { Typography, theme as antdTheme } from 'antd';
import { FolderTree, Link2, RefreshCw, Sparkles, Tag } from 'lucide-react';

import {
  ContactFooter,
  GuideDivider as Divider,
  InfoCard,
  SectionTitle,
  Tip,
} from '@/pages/support/components/GuidePrimitives';

const { Paragraph } = Typography;

export default function TaxonomyGuide() {
  const { token } = antdTheme.useToken();

  return (
    <div style={{ maxWidth: 820 }}>
      <SectionTitle icon={<FolderTree size={20} />}>Tassonomia</SectionTitle>
      <Paragraph style={{ fontSize: 14.5, lineHeight: 1.7, color: token.colorText }}>
        La pagina <code>/taxonomy</code> gestirà <strong>categorie</strong> e <strong>tag</strong>{' '}
        della piattaforma, sincronizzati bidirezionalmente con WordPress. Al momento in{' '}
        <strong>Coming Soon</strong>. Il sync automatico backend però è già attivo — i tag/categorie
        che usi in <code>/articles/:id</code> sono letti dal WP.
      </Paragraph>

      <Tip icon="🔄">
        Sync WP → GSI è gia attivo. Al primo caricamento della (futura) pagina{' '}
        <code>/taxonomy</code> viene eseguito un <code>syncWP()</code> che pulla tutti i
        tag/categorie da WordPress. Anche l&rsquo;editor articolo ha autocomplete sui tag esistenti
        grazie a questo sync.
      </Tip>

      <Divider />

      <SectionTitle icon={<Tag size={18} />}>Cosa conterrà</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        Layout a 2 tab:
      </Paragraph>

      <InfoCard
        icon={<FolderTree size={16} />}
        title="Categorie"
        body="Gerarchia WP (parent/child). Tabella con nome, slug, descrizione, count articoli. CRUD completo + bulk delete."
      />
      <InfoCard
        icon={<Tag size={16} />}
        title="Tag"
        body="Lista piatta senza gerarchia. Stessa tabella (nome, slug, count) + CRUD + ricerca full-text sul nome."
      />

      <Divider />

      <SectionTitle icon={<RefreshCw size={18} />}>Sync con WordPress</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        Il sync è bidirezionale:
      </Paragraph>
      <ul style={{ paddingLeft: 22, fontSize: 14, lineHeight: 1.9, color: token.colorText }}>
        <li>
          <strong>Pull</strong> (WP → GSI): manual (pulsante Sincronizza WP in alto a destra) + al
          mount della pagina. Aggiorna GSI con ciò che esiste in WP.
        </li>
        <li>
          <strong>Push</strong> (GSI → WP): automatico al <em>publish</em> di un articolo. I
          tag/categorie assegnati in GSI vengono creati in WP se non esistono.
        </li>
        <li>
          <strong>Conflict resolution</strong>: match per <code>slug</code>. Se esiste in WP con
          stesso slug, viene collegato; se no, creato.
        </li>
      </ul>

      <Divider />

      <SectionTitle icon={<Link2 size={18} />}>Articoli ↔ Taxonomy</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        La relazione è <strong>many-to-many</strong>:
      </Paragraph>
      <ul style={{ paddingLeft: 22, fontSize: 14, lineHeight: 1.9, color: token.colorText }}>
        <li>Un articolo ha 0..N tag</li>
        <li>Un articolo ha 0..1 categoria</li>
        <li>Un tag/categoria è usato da 0..N articoli</li>
      </ul>
      <Paragraph style={{ fontSize: 13.5, lineHeight: 1.7, color: token.colorTextSecondary }}>
        Assegnazione da <code>/articles/:id</code> (sidebar destra → card Taxonomy) o via suggest AI
        (MiniLM analizza il testo e propone tag rilevanti).
      </Paragraph>

      <Divider />

      <SectionTitle icon={<Sparkles size={18} />}>Feature in arrivo</SectionTitle>
      <ul style={{ paddingLeft: 22, fontSize: 14, lineHeight: 1.9, color: token.colorText }}>
        <li>
          <strong>Merge tag</strong>: unisce 2 tag simili (&ldquo;retail&rdquo; +
          &ldquo;Retail&rdquo; → 1 solo), ridireziona tutti gli articoli.
        </li>
        <li>
          <strong>Bulk edit</strong>: rinomina, riassegna slug, cambia parent (per categorie).
        </li>
        <li>
          <strong>Tag auto-suggested globali</strong>: AI propone nuovi tag basati su cluster di
          articoli senza tag.
        </li>
      </ul>

      <div
        style={{
          marginTop: 24,
          padding: '18px 22px',
          borderRadius: 12,
          border: `1px dashed ${token.colorBorderSecondary}`,
          background: token.colorBgLayout,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: token.colorBgContainer,
            border: `1px solid ${token.colorBorderSecondary}`,
            color: token.colorPrimary,
            flexShrink: 0,
          }}
        >
          <Sparkles size={18} strokeWidth={2} />
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <Paragraph
            style={{
              margin: 0,
              fontSize: 13.5,
              color: token.colorText,
              fontWeight: 600,
              lineHeight: 1.4,
            }}
          >
            Nel frattempo
          </Paragraph>
          <Paragraph
            style={{
              margin: 0,
              fontSize: 12.5,
              color: token.colorTextSecondary,
              lineHeight: 1.6,
            }}
          >
            Per gestire tag/categorie usa direttamente WordPress admin. GSI li pulla automaticamente
            a ogni mount della pagina e all&rsquo;editor di articoli.
          </Paragraph>
        </div>
      </div>

      <ContactFooter />
    </div>
  );
}
