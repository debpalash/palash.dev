/**
 * Attributes the Solid 2.0 RC JSX typings dropped but that we still emit
 * on purpose: `focusable` is a real SVG attribute (keeps decorative icons
 * out of IE/legacy tab order), and `http-equiv="content-language"` is the
 * site's long-standing language hint. Both render fine — this only widens
 * the types.
 */
import '@solidjs/web/jsx-runtime';

declare module '@solidjs/web/jsx-runtime' {
  namespace JSX {
    interface SvgSVGAttributes<T> {
      focusable?: 'true' | 'false' | boolean;
    }
    interface MetaHTMLAttributes<T> {
      'http-equiv'?: string;
    }
  }
}
