import DOMPurify from 'dompurify';

interface SafeHTMLProps {
  html: string;
  className?: string;
}

export default function SafeHTML({ html, className }: SafeHTMLProps) {
  const clean = DOMPurify.sanitize(html);
  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
