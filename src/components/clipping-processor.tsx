'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import {
  FolderKanban,
  Clipboard,
  Lightbulb,
  LoaderCircle,
  Tag,
  UploadCloud,
  File as FileIcon,
  X,
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

const initialState = {
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
        'Process Clipping'
      )}
    </Button>
  );
}

function ResultCard({
  icon,
  title,
  value,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
        {icon}
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {value && <p className="text-sm text-muted-foreground">{value}</p>}
        {children}
      </CardContent>
    </Card>
  );
}

export function ClippingProcessor() {
  const [formState, formAction] = useActionState(
    processClippingAction,
    initialState
  );
  const clippingImage = PlaceHolderImages.find(
    (img) => img.id === 'clipping-upload'
  );
  const result: AnalysisResult | null = formState.data;
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSelectFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Submit News Clipping</CardTitle>
          <CardDescription>
            Upload an image/PDF of a news clipping or paste the text directly
            below to analyze it for human rights violations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="grid gap-6">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="text-input">Clipping Text (Optional)</Label>
                <Textarea
                  id="text-input"
                  name="text"
                  placeholder="Paste the full text of the news article here..."
                  className="min-h-[200px] lg:min-h-[300px]"
                />
                {formState?.errors?.text && (
                  <p className="text-sm text-destructive">
                    {formState.errors.text}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label>Upload File</Label>
                <div className="relative flex h-full min-h-[200px] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/25 p-4 text-center">
                  {clippingImage && !selectedFile && (
                    <Image
                      src={clippingImage.imageUrl}
                      alt={clippingImage.description}
                      fill
                      className="object-cover opacity-10 rounded-md"
                      data-ai-hint={clippingImage.imageHint}
                    />
                  )}
                   <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="application/pdf,image/jpeg,image/png"
                    name="file"
                  />
                  {selectedFile ? (
                     <div className="z-10 flex flex-col items-center gap-4 text-center">
                        <FileIcon className="size-12 text-foreground" />
                        <p className="font-medium">{selectedFile.name}</p>
                        <Button type="button" variant="ghost" size="sm" onClick={handleRemoveFile}>
                           <X className="mr-2 size-4" /> Remove
                        </Button>
                     </div>
                  ) : (
                    <div className="z-10 flex flex-col items-center gap-2">
                        <UploadCloud className="size-10 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                        Drag & drop or click to upload PDF/JPG/PNG
                        </p>
                        <Button type="button" variant="outline" size="sm" onClick={handleSelectFileClick}>
                        Select File
                        </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <SubmitButton />
            </div>
          </form>
        </CardContent>
      </Card>

      {result && (
        <div className="lg:col-span-2 grid gap-8">
          <h2 className="text-2xl font-bold">Analysis Results</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ResultCard
              icon={<Lightbulb className="text-accent" />}
              title="AI Summary"
              value={result.summary}
            />
            <ResultCard icon={<Tag className="text-accent" />} title="Category">
              <div className="flex flex-col gap-2">
                <Badge variant="secondary" className="text-base w-fit">
                  {result.category}
                </Badge>
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
              </div>
            </ResultCard>
            <ResultCard
              icon={<FolderKanban className="text-accent" />}
              title="Assigned Thematic Area"
              value={result.thematicArea}
            />
          </div>
        </div>
      )}
    </div>
  );
}
