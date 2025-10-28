
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
import { Input } from '@/components/ui/input';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

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
        'Extract Stories'
      )}
    </Button>
  );
}

export function ClippingProcessor() {
  const [state, formAction] = useActionState(processClippingAction, initialState);
  const clippingImage = PlaceHolderImages.find(
    (img) => img.id === 'clipping-upload'
  );

  const [editableResult, setEditableResult] = React.useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (state.data) {
      setEditableResult(state.data);
    }
    if(state.message && state.message !== 'Analysis complete.') {
        toast({
            variant: 'destructive',
            title: 'Processing Failed',
            description: state.message,
        });
    }
  }, [state, toast]);


  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [sourceId, setSourceId] = React.useState<string>('');

  const firestore = useFirestore();
  const { user } = useUser();
  
  const sourcesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'sources');
  }, [firestore]);
  const { data: sources, isLoading: sourcesLoading } = useCollection(sourcesCollection);

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

  const handleSaveReport = () => {
    if (!editableResult || !user || !sourceId || !firestore) return;
    const reportRef = doc(collection(firestore, 'reports'));
    const newReport = {
        ...editableResult,
        id: reportRef.id,
        sourceId: sourceId,
        userId: user.uid,
        uploadDate: new Date().toISOString(),
        publicationDate: new Date().toISOString(), // Placeholder
        title: editableResult.summary.substring(0, 50) + '...',
        content: editableResult.extractedArticle, // Save the full extracted article
    };
    setDocumentNonBlocking(reportRef, newReport, {});
    toast({
        title: "Report Saved",
        description: "Your report has been successfully saved.",
      });
  };
  
  const handleResultChange = (field: keyof AnalysisResult, value: string | number | boolean) => {
    if (editableResult) {
      setEditableResult({ ...editableResult, [field]: value });
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Submit News Clipping</CardTitle>
          <CardDescription>
            Select a source, then upload an image/PDF of a news clipping or paste the text directly
            below to analyze it for human rights violations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="grid gap-6">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="source-select">Source</Label>
                 <Select name="sourceId" onValueChange={setSourceId} value={sourceId}>
                    <SelectTrigger id="source-select" disabled={sourcesLoading}>
                        <SelectValue placeholder="Select a news source..." />
                    </SelectTrigger>
                    <SelectContent>
                        {sources?.map((source) => (
                            <SelectItem key={source.id} value={source.id}>{source.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Label htmlFor="text-input">Clipping Text (Optional)</Label>
                <Textarea
                  id="text-input"
                  name="text"
                  placeholder="Paste the full text of the news article here..."
                  className="min-h-[200px] lg:min-h-[260px]"
                />
                {state?.errors?.text && (
                  <p className="text-sm text-destructive">
                    {state.errors.text}
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

      {editableResult && editableResult.containsViolation && (
        <div className="lg:col-span-2 grid gap-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Analysis Results</h2>
            <Button onClick={handleSaveReport} disabled={!user}>
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
                    <Textarea value={editableResult.extractedArticle} readOnly className="min-h-[150px] bg-muted/50" />
                </CardContent>
             </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="text-base font-medium flex items-center gap-4"><Lightbulb className="text-accent" /> AI Summary</CardTitle>
                </Header>
                <CardContent>
                    <Textarea value={editableResult.summary} onChange={(e) => handleResultChange('summary', e.target.value)} className="min-h-[120px]" />
                </CardContent>
             </Card>
             <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-medium flex items-center gap-4"><Tag className="text-accent" /> Category</CardTitle>
                    </Header>
                    <CardContent className="space-y-2">
                        <Input value={editableResult.category} onChange={(e) => handleResultChange('category', e.target.value)} />
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                Confidence:
                            </span>
                            <Progress
                                value={editableResult.confidence * 100}
                                className="w-[60%]"
                            />
                            <span className="text-sm font-medium">
                                {Math.round(editableResult.confidence * 100)}%
                            </span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-medium flex items-center gap-4"><FolderKanban className="text-accent" /> Assigned Thematic Area</CardTitle>
                    </Header>
                    <CardContent>
                        <Input value={editableResult.thematicArea} onChange={(e) => handleResultChange('thematicArea', e.target.value)} />
                    </CardContent>
                </Card>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
