import { AppHeader } from '@/components/layout/app-header';
import { ClippingProcessor } from '@/components/clipping-processor';
import { Suspense } from 'react';

export default function ClippingProcessorPage() {
  return (
    <div className="w-full">
      <AppHeader title="AI Story Extractor" />
      <Suspense fallback={<div>Loading...</div>}>
        <ClippingProcessor />
      </Suspense>
    </div>
  );
}
