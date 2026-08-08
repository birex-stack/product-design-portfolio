import React, { useEffect, useRef } from 'react';
import '../prototype-banner.css';

/** Fixed prototype banner — same look as ibm-xftm-soc `.soc-proto-banner`. */
export function PrototypeBanner() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const publishHeight = () => {
      document.documentElement.style.setProperty(
        '--prototype-banner-height',
        `${el.offsetHeight}px`
      );
    };

    publishHeight();
    const observer = new ResizeObserver(publishHeight);
    observer.observe(el);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty('--prototype-banner-height');
    };
  }, []);

  return (
    <div ref={ref} className="slo-proto-banner">
      <a href="../elastic-slo.html">← Back to Elastic SLO case study</a>
      <span>Elastic Observability (with improvements ideas)</span>
    </div>
  );
}
