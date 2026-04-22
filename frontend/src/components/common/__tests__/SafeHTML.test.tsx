import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import SafeHTML from '../SafeHTML';

describe('SafeHTML', () => {
  it('renderizza markup HTML benigno', () => {
    const { container } = render(<SafeHTML html="<p>hello <strong>world</strong></p>" />);
    expect(container.querySelector('p')).not.toBeNull();
    expect(container.querySelector('strong')?.textContent).toBe('world');
  });

  it('rimuove i tag <script> (XSS protection)', () => {
    const xss = '<p>ok</p><script>window.evil=true</script>';
    const { container } = render(<SafeHTML html={xss} />);
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain('ok');
  });

  it('rimuove gli event handler inline', () => {
    const xss = `<img src="x" onerror="window.evil=true">`;
    const { container } = render(<SafeHTML html={xss} />);
    const img = container.querySelector('img');
    // DOMPurify rimuove onerror e simili attribute.
    expect(img?.getAttribute('onerror')).toBeNull();
  });

  it('applica la className passata', () => {
    const { container } = render(<SafeHTML html="<p>x</p>" className="my-class" />);
    expect(container.firstChild).toHaveClass('my-class');
  });
});
