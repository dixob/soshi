'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '@/lib/store';

interface TourStep {
  target: string;
  title: string;
  body: string;
}

const DESKTOP_STEPS: TourStep[] = [
  {
    target: 'sidebar-nav',
    title: 'Your navigation',
    body: 'Dashboard, Pipeline, Aftercare, Contacts — everything you need is one click away.',
  },
  {
    target: 'nav-pipeline',
    title: 'Preneed pipeline',
    body: 'Track every prospect from first contact to conversion with a simple drag-and-drop board.',
  },
  {
    target: 'nav-contacts',
    title: 'Family contacts',
    body: 'Keep all your families organized in one place. You can also import from a spreadsheet.',
  },
  {
    target: 'stat-cards',
    title: 'Your dashboard',
    body: 'See what needs attention today — overdue follow-ups, pipeline status, and aftercare at a glance.',
  },
];

const MOBILE_STEPS: TourStep[] = [
  {
    target: '',
    title: 'Welcome to Soshi!',
    body: 'Your CRM is set up and ready to go. Use the menu in the top-left to navigate between your Dashboard, Pipeline, Contacts, and more.',
  },
  {
    target: 'stat-cards',
    title: 'Your dashboard',
    body: 'See what needs attention today — overdue follow-ups, pipeline status, and aftercare at a glance.',
  },
];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export default function WelcomeTour() {
  const { markTourCompleted } = useStore();
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const steps = isMobile ? MOBILE_STEPS : DESKTOP_STEPS;
  const currentStep = steps[step];
  const isLast = step === steps.length - 1;

  // Detect mount + mobile
  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth < 768);
  }, []);

  // Position tooltip relative to target element
  const updatePosition = useCallback(() => {
    if (!currentStep?.target) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(`[data-tour-target="${currentStep.target}"]`);
    if (!el) {
      setTargetRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setTargetRect({
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
    });
  }, [currentStep]);

  useLayoutEffect(() => {
    updatePosition();
  }, [step, updatePosition]);

  // Reposition on resize/scroll
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      updatePosition();
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [updatePosition]);

  const handleNext = () => {
    if (isLast) {
      markTourCompleted();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleSkip = () => {
    markTourCompleted();
  };

  if (!mounted) return null;

  // Compute tooltip position
  let tooltipStyle: React.CSSProperties = {};

  if (targetRect) {
    if (isMobile) {
      // Below the target
      tooltipStyle = {
        top: Math.min(targetRect.top + targetRect.height + 12, window.innerHeight - 200),
        left: 16,
        right: 16,
      };
    } else {
      // Right of the target
      tooltipStyle = {
        top: targetRect.top + targetRect.height / 2 - 60,
        left: targetRect.left + targetRect.width + 16,
        maxWidth: 320,
      };
      // If tooltip would overflow right edge, position left instead
      if (tooltipStyle.left && (tooltipStyle.left as number) + 320 > window.innerWidth) {
        tooltipStyle.left = targetRect.left - 336;
      }
    }
  } else {
    // Centered (mobile welcome step with no target)
    tooltipStyle = {
      top: '50%',
      left: 16,
      right: 16,
      transform: 'translateY(-50%)',
    };
  }

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-stone-900/50" onClick={handleSkip} />

      {/* Spotlight cutout */}
      {targetRect && (
        <div
          className="absolute tour-spotlight pointer-events-none"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            backgroundColor: 'transparent',
            boxShadow: '0 0 0 9999px rgba(28, 25, 23, 0.5)',
            borderRadius: 8,
            zIndex: 1,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="absolute bg-white rounded-xl shadow-xl border border-stone-200 p-5 tour-tooltip"
        style={{ ...tooltipStyle, zIndex: 2, position: 'fixed' }}
      >
        <h3 className="font-semibold text-stone-900 text-sm mb-1">
          {currentStep.title}
        </h3>
        <p className="text-sm text-stone-500 leading-relaxed mb-4">
          {currentStep.body}
        </p>

        <div className="flex items-center justify-between">
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === step ? 'bg-stone-900' : 'bg-stone-200'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSkip}
              className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
            >
              Skip tour
            </button>
            <button
              onClick={handleNext}
              className="bg-stone-900 text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-stone-800 transition-colors"
            >
              {isLast ? 'Got it!' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
