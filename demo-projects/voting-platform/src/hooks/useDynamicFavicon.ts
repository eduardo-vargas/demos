import { useEffect } from 'react';

const LAVA_LAMP_SVG = {
  capTop: (color: string) => `<polygon points="7.8 0 12.2 0 12.2 2.2 7.8 2.2" fill="${color}"/>`,
  base: (color: string) =>
    `<path d="M6.9 15h5.2c-.1.7-.1 1.3 0 1.9q.15.75.6 1.5H6.9z" fill="${color}"/>`,
  blob: (color: string, d: string) => `<path fill="${color}" d="${d}"/>`,
  outline: (color: string, d: string) =>
    `<path stroke="${color}" stroke-linecap="round" stroke-linejoin="round" fill="none" d="${d}"/>`,
};

const LAVA_LAMP_PATHS = {
  blobs: [
    'M10.299 6.648c-.239-.597-.218-1.289.946-1.289 1.165 0 1.499 1.592.861 2.146s-1.567-.26-1.807-.857',
    'M8.296 4.206c.064-.507.623-.762 1.47-1.018.668-.202 2.012-.609 1.935 0S10.17 4.494 9.532 5.047c-.638.554-1.3-.333-1.236-.841',
    'M8.217 7.308c1.032 0 .867 1.371 1.869 2.102 1.138.83 2.263.757 2.718 1.172.2.182.404.651.236 1.409s-2.412 2.203-3.42 1.879c-1.007-.323-1.235-1.063-1.749-1.915-.513-.852-.686-4.647.346-4.647',
  ],
  outline:
    'M6.025 11.279 7.8 0h4.138l1.874 11.245c.073.435.001.882-.204 1.269l-1.019 1.921c-.411.777-.46 1.706-.133 2.524l.391.978c.099.248-.015.533-.255.636l-5.353.037c-.26 0-.471-.218-.471-.487q0-.106.042-.202l.423-.964c.358-.816.335-1.757-.064-2.553l-.958-1.915c-.186-.372-.252-.796-.186-1.21',
};

function generateLavaLampSvg(iconColor: string, lavaColor: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
  <g fill="none" fill-rule="evenodd">
    ${LAVA_LAMP_SVG.capTop(iconColor)}
    ${LAVA_LAMP_SVG.base(iconColor)}
    ${LAVA_LAMP_SVG.blob(lavaColor, LAVA_LAMP_PATHS.blobs[0])}
    ${LAVA_LAMP_SVG.blob(lavaColor, LAVA_LAMP_PATHS.blobs[1])}
    ${LAVA_LAMP_SVG.outline(iconColor, LAVA_LAMP_PATHS.outline)}
    ${LAVA_LAMP_SVG.blob(lavaColor, LAVA_LAMP_PATHS.blobs[2])}
  </g>
</svg>`;
}

function setFavicon(svg: string): void {
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  const existingIcon = document.querySelector("link[rel='icon']");
  if (existingIcon) {
    existingIcon.setAttribute('href', url);
  } else {
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    link.href = url;
    document.head.appendChild(link);
  }
}

export interface UseDynamicFaviconOptions {
  iconColorVar?: string;
  fillColorVar?: string;
  defaultIconColor?: string;
  defaultFillColor?: string;
}

export function useDynamicFavicon({
  iconColorVar = '--iconPrimary',
  fillColorVar = '--lavaLampFill',
  defaultIconColor = '#222',
  defaultFillColor = '#F48120',
}: UseDynamicFaviconOptions = {}): void {
  useEffect(() => {
    const updateFavicon = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      const iconColor = computedStyle.getPropertyValue(iconColorVar).trim() || defaultIconColor;
      const lavaColor = computedStyle.getPropertyValue(fillColorVar).trim() || defaultFillColor;
      setFavicon(generateLavaLampSvg(iconColor, lavaColor));
    };

    updateFavicon();

    const observer = new MutationObserver(updateFavicon);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateFavicon);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', updateFavicon);
    };
  }, [iconColorVar, fillColorVar, defaultIconColor, defaultFillColor]);
}
