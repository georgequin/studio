'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
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
  Sparkles,
  Text,
  AlertTriangle,
  Link,
  CheckCircle2,
  Info,
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
import { useCollection, useFirestore, useUser } from '@/lib/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/lib/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { THEMATIC_AREA_MAP } from '@/lib/thematic-areas';
import {
  autoCropBlob,
  buildFileMetaKey,
  formatFileSize,
  type FileMeta
} from '@/lib/image-processing';
import { AnalysisResultCard } from '@/components/dashboard/AnalysisResultCard';
import { PlaceHolderImages } from '@/lib/placeholder-images';



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
    <Button type="submit" disabled={pending} size="lg">
      {pending ? (
        <>
          <LoaderCircle className="animate-spin" />
          Analyzing...
        </>
      ) : (
        <>
          <Sparkles className="mr-2" />
          Extract Stories
        </>
      )}
    </Button>
  );
}





export function ClippingProcessor() {
  const [state, formAction] = useActionState(processClippingAction, initialState);
  const [editableResults, setEditableResults] = React.useState<AnalysisResult[] | null>(null);
  const { toast } = useToast();

  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [showCamera, setShowCamera] = React.useState(false);

  const [files, setFiles] = React.useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [fileMeta, setFileMeta] = React.useState<FileMeta>({});

  const [sourceId, setSourceId] = React.useState<string>('');

  const firestore = useFirestore();
  const { user } = useUser();
  const sourcesCollection = React.useMemo(() => {
    return firestore ? collection(firestore, 'sources') : null;
  }, [firestore]);
  const { data: sources, isLoading: sourcesLoading } = useCollection(sourcesCollection);

  React.useEffect(() => {
    if (!state) {
      return;
    }

    if (state.message) {
      if (state.errors) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: state.message,
        });
      } else if (state.data) {
        toast({
          title: 'Analysis Complete',
          description: state.message,
        });
      } else {
        toast({
          title: 'Notification',
          description: state.message,
        });
      }
    }

    if (state.data) {
      setEditableResults(state.data);
    }
  }, [state, toast]);

  const handleUpdateResult = (index: number, field: keyof AnalysisResult, value: string) => {
    if (!editableResults) return;

    const newResults = [...editableResults];
    const updatedResult = { ...newResults[index] };

    // @ts-ignore - This is a safe conversion for the controlled components
    updatedResult[field] = field === 'confidence' ? parseFloat(value) : value;

    if (field === 'category') {
      updatedResult['thematicArea'] = THEMATIC_AREA_MAP[value as keyof typeof THEMATIC_AREA_MAP] || 'Unassigned';
    }

    newResults[index] = updatedResult;
    setEditableResults(newResults);
  };

  const handleSaveReport = (resultToSave: AnalysisResult, currentSourceId: string) => {
    if (!firestore || !user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not connect to the database. Please try again.',
      });
      return;
    }
    if (!currentSourceId) {
      toast({
        variant: 'destructive',
        title: 'Source Required',
        description: 'Please select a news source before saving.',
      });
      return;
    }

    const newReportRef = doc(collection(firestore, 'reports'));
    const reportData = {
      ...resultToSave,
      id: newReportRef.id,
      sourceId: currentSourceId,
      userId: user.uid,
      publicationDate: new Date().toISOString(),
      uploadDate: serverTimestamp(),
      content: resultToSave.extractedArticle,
    };

    setDocumentNonBlocking(newReportRef, reportData, {});

    toast({
      title: 'Report Saved!',
      description: 'The new report has been saved to the database.',
    });

    setEditableResults(prev => prev ? prev.filter(r => r !== resultToSave) : null);
  };


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const incomingFiles = Array.from(event.target.files);
    event.target.value = '';

    try {
      const processedResults = await Promise.all(
        incomingFiles.map(async (file) => {
          const { file: processedFile, wasAutoCropped } = await autoCropBlob(
            file,
            file.name
          );
          return { processedFile, wasAutoCropped, original: file };
        })
      );

      setFiles((prevFiles) => [
        ...prevFiles,
        ...processedResults.map(({ processedFile }) => processedFile),
      ]);

      setFileMeta((prevMeta) => {
        const nextMeta = { ...prevMeta };
        processedResults.forEach(({ processedFile, wasAutoCropped, original }) => {
          nextMeta[buildFileMetaKey(processedFile)] = {
            wasAutoCropped,
            originalName: original.name,
          };
        });
        return nextMeta;
      });

      if (processedResults.some((result) => result.wasAutoCropped)) {
        toast({
          title: 'Images enhanced',
          description: 'We auto-cropped your newspaper photos for clarity.',
        });
      }
    } catch (error) {
      console.error('Failed to process selected files', error);
      toast({
        variant: 'destructive',
        title: 'Image processing failed',
        description:
          'We could not enhance one or more images. Please try again or upload a different file.',
      });
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prevFiles) => {
      const nextFiles = prevFiles.filter((_, i) => i !== index);
      const removedFile = prevFiles[index];
      if (removedFile) {
        setFileMeta((prevMeta) => {
          const nextMeta = { ...prevMeta };
          delete nextMeta[buildFileMetaKey(removedFile)];
          return nextMeta;
        });
      }
      return nextFiles;
    });
  };

  const handleOpenCamera = () => {
    setShowCamera(true);
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setHasCameraPermission(null);
  };

  const handleCapture = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((canvasBlob) => resolve(canvasBlob), 'image/jpeg', 0.92)
        );
        if (blob) {
          const suggestedName = `capture-${Date.now()}.jpg`;
          const { file: processedFile, wasAutoCropped } = await autoCropBlob(
            blob,
            suggestedName
          );
          setFiles((prevFiles) => [...prevFiles, processedFile]);
          setFileMeta((prevMeta) => ({
            ...prevMeta,
            [buildFileMetaKey(processedFile)]: {
              wasAutoCropped,
              originalName: suggestedName,
            },
          }));
          toast({
            title: wasAutoCropped ? 'Capture ready' : 'Capture saved',
            description: wasAutoCropped
              ? 'We trimmed the edges to keep the article in focus.'
              : 'Your capture is ready for analysis.',
          });
          handleCloseCamera();
        } else {
          toast({
            variant: 'destructive',
            title: 'Capture failed',
            description: 'We could not read the camera frame. Please try again.',
          });
        }
      }
    }
  };

  const handleLoadExample = async () => {
    const exampleImage = PlaceHolderImages.find(img => img.id === 'clipping-upload');
    if (!exampleImage) return;

    try {
      const response = await fetch(exampleImage.imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'example-clipping.jpg', { type: 'image/jpeg' });

      const { file: processedFile, wasAutoCropped } = await autoCropBlob(
        file,
        file.name
      );

      setFiles((prevFiles) => [...prevFiles, processedFile]);
      setFileMeta((prevMeta) => ({
        ...prevMeta,
        [buildFileMetaKey(processedFile)]: {
          wasAutoCropped,
          originalName: 'example-clipping.jpg',
        },
      }));

      toast({
        title: 'Example loaded',
        description: 'Ready for analysis.',
      });
    } catch (error) {
      console.error('Failed to load example', error);
      toast({
        variant: 'destructive',
        title: 'Error loading example',
        description: 'Could not load the example image.',
      });
    }
  };

  React.useEffect(() => {
    if (showCamera) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          setHasCameraPermission(true);

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings.',
          });
        }
      };
      getCameraPermission();
    }

    // Cleanup function
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showCamera, toast]);


  return (
    <div className="grid gap-8 p-4 md:p-6 lg:p-10 max-w-6xl mx-auto">
      {showCamera ? (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Camera Capture</CardTitle>
            <CardDescription>
              Align the newspaper clipping within the frame. We will auto-crop the article for you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full aspect-video rounded-md bg-muted"
                autoPlay
                muted
                playsInline
              />
              {hasCameraPermission === false && (
                <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/50">
                  <Alert variant="destructive" className="w-auto">
                    <AlertTitle>Camera Access Required</AlertTitle>
                    <AlertDescription>Please allow camera access to use this feature.</AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </CardContent>
          <CardContent className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCloseCamera}>
              Cancel
            </Button>
            <Button onClick={handleCapture} disabled={!hasCameraPermission}>
              <Camera className="mr-2" /> Capture
            </Button>
          </CardContent>
        </Card>
      ) : (
        <form action={formAction} className="grid gap-8">
          <div className="grid gap-8">
            <Card>
              <CardHeader className="space-y-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl font-semibold">Prepare your clipping</CardTitle>
                    <CardDescription className="text-base">
                      Upload a scan or capture a photo, choose the source, then let the AI extract and summarize the stories.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Enhanced OCR
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-full bg-primary/10 p-2">
                    <UploadCloud className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Smart image intake</p>
                    <p className="text-sm text-muted-foreground">
                      We auto-crop scans to keep the article sharp and remove background clutter.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-full bg-primary/10 p-2">
                    <Text className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">High fidelity OCR</p>
                    <p className="text-sm text-muted-foreground">
                      Extracted text is cleaned before analysis to speed up downstream AI work.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-full bg-primary/10 p-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Actionable insights</p>
                    <p className="text-sm text-muted-foreground">
                      Review, edit, and save each extracted incident with confidence estimates.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid items-start gap-8 lg:grid-cols-3">
              <div className="sticky top-6 flex flex-col gap-8 lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Input settings</CardTitle>
                    <CardDescription>Provide the context we need to process your clipping.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="source">News Source</Label>
                      <Select name="sourceId" value={sourceId} onValueChange={setSourceId} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a source..." />
                        </SelectTrigger>
                        <SelectContent>
                          {sourcesLoading ? (
                            <SelectItem value="loading" disabled>
                              Loading sources...
                            </SelectItem>
                          ) : (
                            sources?.map((source) => (
                              <SelectItem key={source.id} value={source.id}>
                                {source.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label>From Image</Label>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 min-w-[140px]"
                        >
                          <UploadCloud className="mr-2" /> Upload
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleOpenCamera}
                          className="flex-1 min-w-[140px]"
                        >
                          <Camera className="mr-2" /> Camera
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleLoadExample}
                          className="flex-1 min-w-[140px]"
                        >
                          <Sparkles className="mr-2" /> Try Example
                        </Button>
                      </div>
                      <Input
                        ref={fileInputRef}
                        type="file"
                        name="files"
                        className="hidden"
                        onChange={handleFileChange}
                        multiple
                        accept="image/*"
                      />
                      {files.length > 0 && (
                        <div className="grid gap-2 pt-2">
                          {files.map((file, index) => {
                            const key = buildFileMetaKey(file);
                            const meta = fileMeta[key];
                            return (
                              <div
                                key={key}
                                className="rounded-md border bg-background p-3 shadow-sm transition hover:border-primary/40"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-start gap-3">
                                    <div className="rounded-md bg-primary/10 p-2 text-primary">
                                      <FileIcon className="h-4 w-4" />
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-sm font-medium leading-tight">{file.name}</p>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{formatFileSize(file.size)}</span>
                                        {meta?.wasAutoCropped && (
                                          <>
                                            <span>•</span>
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
                                              <CheckCircle2 className="h-3 w-3" />
                                              Auto-cropped
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="flex-shrink-0 h-7 w-7"
                                    onClick={() => handleRemoveFile(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                {meta?.wasAutoCropped && (
                                  <p className="mt-2 text-xs text-muted-foreground">
                                    Trimmed from <span className="font-medium text-foreground">{meta.originalName}</span> to
                                    keep the article in frame.
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="text">From Text</Label>
                      <Textarea
                        id="text"
                        name="text"
                        placeholder="Or paste the article text here..."
                        className="min-h-[150px] text-base"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertTitle>How it Works</AlertTitle>
                  <AlertDescription className="mt-2">
                    <ol className="list-decimal list-inside space-y-1">
                      <li><strong>Select Source & Input:</strong> Choose a newspaper and upload an image or paste text.</li>
                      <li><strong>Extract:</strong> Click "Extract Stories" to let AI find incidents.</li>
                      <li><strong>Review & Save:</strong> Check the results below, edit if needed, and click "Save Report" to store it.</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              </div>

              <div className="lg:col-span-2">
                <Card className="min-h-[400px]">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle>Review before analysis</CardTitle>
                        <CardDescription>
                          Double-check the inputs, then start the extraction. We'll keep you posted along the way.
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Info className="h-3.5 w-3.5" />
                        Expected time: &lt; 30s
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
                    <div className="relative flex h-48 w-48 items-center justify-center rounded-full border border-dashed border-muted bg-muted/30">
                      <Sparkles className="h-20 w-20 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">AI Story Extractor is standing by.</h3>
                    <p className="max-w-sm text-muted-foreground">
                      Click below to analyze. While we work, you'll see real-time progress updates for scanning, detection, and
                      summarization.
                    </p>
                    <SubmitButton />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </form>
      )}

      {editableResults &&
        editableResults.map((result, index) => (
          <AnalysisResultCard
            key={index}
            result={result}
            index={index}
            onUpdate={handleUpdateResult}
            onSave={handleSaveReport}
            sourceId={sourceId}
          />
        ))}
    </div>
  );
}
