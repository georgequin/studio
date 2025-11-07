'use client';

import { useActionState, useTransition } from 'react';
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
  Sparkles,
  Text,
  AlertTriangle,
  Link,
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
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { THEMATIC_AREA_MAP } from '@/lib/thematic-areas';

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

const AnalysisResultCard = ({
    result,
    onSave,
    onUpdate,
    index,
    sourceId,
}: {
    result: AnalysisResult;
    onSave: (result: AnalysisResult, sourceId: string) => void;
    onUpdate: (index: number, field: keyof AnalysisResult, value: string) => void;
    index: number;
    sourceId: string;
}) => {
    const { toast } = useToast();
    const handleSaveClick = () => {
        if (!sourceId) {
            toast({
                variant: 'destructive',
                title: 'Source Required',
                description: 'Please select a news source before saving.',
            });
            return;
        }
        onSave(result, sourceId);
    }

    return (
        <div className="lg:col-span-2 grid gap-8 border-t pt-8">
            {result.isDuplicate && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Potential Duplicate Detected</AlertTitle>
                    <AlertDescription>
                        {result.reasoning}
                        <Button variant="link" asChild className="p-0 h-auto ml-2">
                           <a href={`/reports?view=${result.duplicateReportId}`} target="_blank">View Original Report</a>
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Analysis Result #{index + 1}</h2>
             <Button onClick={handleSaveClick} disabled={result.isDuplicate}>
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
                <Textarea value={result.extractedArticle} onChange={(e) => onUpdate(index, 'extractedArticle', e.target.value)} className="min-h-[150px] text-base" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium flex items-center gap-4"><Lightbulb className="text-accent" /> AI Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea value={result.summary} onChange={(e) => onUpdate(index, 'summary', e.target.value)} className="min-h-[120px] text-base" />
              </CardContent>
            </Card>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium flex items-center gap-4"><Tag className="text-accent" /> Category</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Input value={result.category} onChange={(e) => onUpdate(index, 'category', e.target.value)} />
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
                    <Input value={result.thematicArea} onChange={(e) => onUpdate(index, 'thematicArea', e.target.value)} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
    )
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

  const [sourceId, setSourceId] = React.useState<string>('');

  const firestore = useFirestore();
  const { user } = useUser();
  const sourcesCollection = firestore ? collection(firestore, 'sources') : null;
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


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles((prevFiles) => [...prevFiles, ...Array.from(event.target.files!)]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
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
  
  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            canvas.toBlob(blob => {
                if (blob) {
                    const file = new File([blob], `capture-${Date.now()}.png`, { type: 'image/png' });
                    setFiles(prevFiles => [...prevFiles, file]);
                    handleCloseCamera();
                }
            }, 'image/png');
        }
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
    <div className="grid gap-8 p-4 md:p-6 lg:p-8">
      {showCamera ? (
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Camera Capture</CardTitle>
                <CardDescription>Capture an image of the newspaper article.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative">
                    <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
                    {hasCameraPermission === false && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
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
                <Button variant="outline" onClick={handleCloseCamera}>Cancel</Button>
                <Button onClick={handleCapture} disabled={!hasCameraPermission}>
                    <Camera className="mr-2" /> Capture
                </Button>
            </CardContent>
        </Card>
      ) : (
        <form action={formAction} className="grid gap-8">
        <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 flex flex-col gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Input Source</CardTitle>
                    <CardDescription>
                        Provide content for the AI to analyze.
                    </CardDescription>
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
                            <SelectItem value="loading" disabled>Loading sources...</SelectItem>
                            ) : (
                            sources?.map((source) => (
                                <SelectItem key={source.id} value={source.id}>{source.name}</SelectItem>
                            ))
                            )}
                        </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>From Image</Label>
                        <div className="flex items-center gap-2">
                            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                <UploadCloud className="mr-2" /> Upload
                            </Button>
                            <Button type="button" variant="outline" onClick={handleOpenCamera}>
                                <Camera className="mr-2" /> Camera
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
                                {files.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-2 pr-1 bg-muted/50 rounded-md text-sm">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                    <FileIcon className="text-muted-foreground flex-shrink-0" />
                                    <span className="text-muted-foreground truncate">{file.name}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => handleRemoveFile(index)}>
                                    <X className="w-4 h-4" />
                                    </Button>
                                </div>
                                ))}
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
                <AlertDescription>
                The AI will extract text, then identify and summarize all articles related to human rights violations from your provided content.
                </AlertDescription>
            </Alert>
            </div>

            <div className="lg:col-span-2">
            <Card className="min-h-[400px]">
                <CardHeader>
                <CardTitle>Ready to Analyze</CardTitle>
                <CardDescription>
                    Your content is ready. Let our AI find the stories.
                </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-full gap-6 text-center p-8">
                <div className="relative w-48 h-48">
                    <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse"></div>
                    <div className="absolute inset-2 bg-primary/20 rounded-full animate-pulse delay-200"></div>
                     <Sparkles className="w-24 h-24 text-primary absolute inset-1/2 -translate-x-1/2 -translate-y-1/2"/>
                </div>
                <h3 className="text-xl font-semibold text-foreground">AI Story Extractor is standing by.</h3>
                <p className="text-muted-foreground max-w-sm">
                    Click the button below to start the analysis process. You'll be able to review and save each extracted story.
                </p>
                <SubmitButton />
                </CardContent>
            </Card>
            </div>
        </div>
        </form>
      )}


      {editableResults && editableResults.map((result, index) => (
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
