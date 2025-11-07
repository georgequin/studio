'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import {
  FolderKanban,
  Lightbulb,
  LoaderCircle,
  Tag,
  UploadCloud,
  File as FileIcon,
  X,
  Save,
  Newspaper,
  Camera,
} from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { processClippingAction, type AnalysisResult } from '@/app/actions';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

const initialState: {
  message: string | null;
  errors: any | null;
  data: AnalysisResult[] | null;
} = {
  message: null,
  errors: null,
  data: null,
};


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <LoaderCircle className="animate-spin" />
          Processing...
        </>
      ) : (
        'Extract Stories'
      )}
    </Button>
  );
}

const AnalysisResultCard = ({
    result,
    onSave,
    onUpdate,
    index,
}: {
    result: AnalysisResult;
    onSave: () => void;
    onUpdate: (field: keyof AnalysisResult, value: string | number) => void;
    index: number;
}) => {
    return (
        <div className="lg:col-span-2 grid gap-8 border-t pt-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Analysis Result #{index + 1}</h2>
            <Button onClick={onSave}>
              <Save className="mr-2" />
              Save Report
            </Button>
          </div>
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium flex items-center gap-4"><Newspaper className="text-accent" /> Extracted Article</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea value={result.extractedArticle} readOnly className="min-h-[150px] bg-muted/50" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium flex items-center gap-4"><Lightbulb className="text-accent" /> AI Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea value={result.summary} onChange={(e) => onUpdate('summary', e.target.value)} className="min-h-[120px]" />
              </CardContent>
            </Card>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium flex items-center gap-4"><Tag className="text-accent" /> Category</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Input value={result.category} onChange={(e) => onUpdate('category', e.target.value)} />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Confidence:
                    </span>
                    <Progress
                      value={result.confidence * 100}
                      className="w-[60%]"
                    />
                    <span className="text-sm font-medium">
                      {Math.round(result.confidence * 100)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium flex items-center gap-4"><FolderKanban className="text-accent" /> Assigned Thematic Area</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input value={result.thematicArea} onChange={(e) => onUpdate('thematicArea', e.target.value)} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
    )
}

export function ClippingProcessor() {
  const [state, formAction] = useActionState(processClippingAction, initialState);
  const clippingImage = PlaceHolderImages.find(
    (img) => img.id === 'clipping-upload'
  );

  const [editableResults, setEditableResults] = React.useState<AnalysisResult[] | null>(null);
  const { toast } = useToast();

  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useR