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
    onUpdate: (field: keyof AnalysisResult, value: string) => void;
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
                <Textarea value={result.extractedArticle} onChange={(e) => onUpdate('extractedArticle', e.target.value)} className="min-h-[150px]" />
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
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [showCamera, setShowCamera] = React.useState(false);

  const [files, setFiles] = React.useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [sourceId, setSourceId] = React.useState<string>('');

  const firestore = useFirestore();
  const { user } = useUser();
  const sourcesCollection = useMemoFirebase(() => (firestore ? collection(firestore, 'sources') : null), [firestore]);
  const { data: sources, isLoading: sourcesLoading } = useCollection(sourcesCollection);
  
  React.useEffect(() => {
    // This effect runs when the server action completes.
    // It is critical to check if `state` is null to prevent crashing on initial render.
    if (!state) {
      return;
    }
  
    // Handle validation errors or other non-data messages from the server action.
    if (state.message && !state.data) {
      toast({
        variant: state.errors ? 'destructive' : 'default',
        title: state.errors ? 'Error' : 'Notification',
        description: state.message,
      });
    }
  
    // When the AI analysis is successful and returns data.
    if (state.data) {
      setEditableResults(state.data);
      if (state.message) {
        toast({
          title: 'Analysis Complete',
          description: state.message,
        });
      }
    }
  }, [state, toast]);

  const handleUpdateResult = (index: number, field: keyof AnalysisResult, value: string) => {
    if (!editableResults) return;

    const newResults = [...editableResults];
    
    // Create a new object for the specific result being updated
    const updatedResult = { ...newResults[index] };

    if (field === 'confidence') {
        updatedResult[field] = parseFloat(value);
    } else {
        // @ts-ignore
        updatedResult[field] = value;
    }

    if (field === 'category') {
        updatedResult['thematicArea'] = THEMATIC_AREA_MAP[value as keyof typeof THEMATIC_AREA_MAP] || 'Unassigned';
    }
    
    // Replace the old result object with the updated one
    newResults[index] = updatedResult;
    
    setEditableResults(newResults);
};

  const handleSaveReport = (resultToSave: AnalysisResult) => {
    if (!firestore || !user) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not connect to the database. Please try again.',
        });
        return;
    }
    if (!sourceId) {
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
        sourceId: sourceId,
        userId: user.uid,
        publicationDate: new Date().toISOString(),
        uploadDate: serverTimestamp(),
        content: resultToSave.extractedArticle, // Ensure content is the full article
    };

    setDocumentNonBlocking(newReportRef, reportData, {});
    
    toast({
        title: 'Report Saved!',
        description: 'The new report has been saved to the database.',
    });

    // Optionally, remove the saved report from the view
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
      const stream = videoRef.current?.srcObject as MediaStream;
      if (stream) {
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

  // Effect for managing camera stream
  React.useEffect(() => {
    if (showCamera) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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
                <CardDescription>Capture an image of the newspaper clipping.</CardDescription>
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
                <CardTitle>Upload or Paste Clipping</CardTitle>
                <CardDescription>
                    You can upload an image file, use your camera, or paste text directly.
                </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
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
                    <Label>Upload Files</Label>
                    <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <UploadCloud className="mr-2" /> Browse Files
                    </Button>
                    <Button type="button" variant="outline" onClick={handleOpenCamera}>
                        <Camera className="mr-2" /> Use Camera
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
                </div>

                {files.length > 0 && (
                    <div className="grid gap-2">
                    <Label>Selected Files</Label>
                    <div className="flex flex-col gap-2">
                        {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                            <div className="flex items-center gap-2">
                            <FileIcon className="text-muted-foreground" />
                            <span className="text-sm text-muted-foreground truncate">{file.name}</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveFile(index)}>
                            <X className="w-4 h-4" />
                            </Button>
                        </div>
                        ))}
                    </div>
                    </div>
                )}
                
                <div className="grid gap-2">
                    <Label htmlFor="text">Or Paste Text</Label>
                    <Textarea
                    id="text"
                    name="text"
                    placeholder="Paste the article text here..."
                    className="min-h-[150px]"
                    />
                </div>
                </CardContent>
            </Card>

            <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>How it Works</AlertTitle>
                <AlertDescription>
                The AI will extract text from uploaded images (if any), combine it with pasted text, and then identify and summarize all articles related to human rights violations.
                </AlertDescription>
            </Alert>
            </div>

            <div className="lg:col-span-2">
            <Card className="min-h-[400px]">
                <CardHeader>
                <CardTitle>Ready to Process</CardTitle>
                <CardDescription>
                    Your files and text will be analyzed. Click the button below to start.
                </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <Image
                    src={clippingImage?.imageUrl || 'https://placehold.co/600x400'}
                    width={600}
                    height={400}
                    alt={clippingImage?.description || 'Placeholder'}
                    className="max-w-xs rounded-lg"
                    data-ai-hint={clippingImage?.imageHint}
                />
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
              onUpdate={(field, value) => handleUpdateResult(index, field, value as string)}
              onSave={() => handleSaveReport(result)}
          />
      ))}

    </div>
  );
}
