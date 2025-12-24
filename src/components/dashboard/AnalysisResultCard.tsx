
import {
    FolderKanban,
    Lightbulb,
    Tag,
    Save,
    Newspaper,
    AlertTriangle,
} from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { type AnalysisResult } from '@/app/actions';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface AnalysisResultCardProps {
    result: AnalysisResult;
    onSave: (result: AnalysisResult, sourceId: string) => void;
    onUpdate: (index: number, field: keyof AnalysisResult, value: string) => void;
    index: number;
    sourceId: string;
}

export const AnalysisResultCard = ({
    result,
    onSave,
    onUpdate,
    index,
    sourceId,
}: AnalysisResultCardProps) => {
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
