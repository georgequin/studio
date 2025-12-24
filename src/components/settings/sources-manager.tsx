'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import {
  useFirestore,
  useCollection,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
  errorEmitter,
  FirestorePermissionError,
} from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

const sourceSchema = z.object({
  name: z.string().min(1, 'Source name is required.'),
  url: z.string().url('Invalid URL format.').optional().or(z.literal('')),
});

const sourcesFormSchema = z.object({
  sources: z.array(sourceSchema),
});

type SourcesFormValues = z.infer<typeof sourcesFormSchema>;

const initialSources = [
  { name: 'The Punch (Lagos)', url: '' },
  { name: 'Vanguard (Lagos)', url: '' },
  { name: 'The Guardian (Nigeria) (Lagos)', url: '' },
  { name: 'ThisDay (Lagos/Abuja)', url: '' },
  { name: 'Daily Trust (Abuja)', url: '' },
  { name: 'Nigerian Tribune (Ibadan)', url: '' },
  { name: 'The Sun (Lagos)', url: '' },
  { name: 'The Nation (Nigeria) (Lagos)', url: '' },
  { name: 'Leadership (Abuja)', url: '' },
  { name: 'Blueprint (newspaper) (Abuja)', url: '' },
  { name: 'Premium Times (Online, Abuja)', url: '' },
  { name: 'The Whistler (Online, Abuja)', url: '' },
  { name: 'Prime 9ja Online (Edo State, online)', url: '' },
  { name: 'The Tide (Port Harcourt, Rivers State)', url: '' },
  { name: 'Osun Defender (Osogbo, Osun State)', url: '' },
  { name: 'The Herald (Nigeria) (Kwara State)', url: '' },
  { name: 'National Network (Port Harcourt)', url: '' },
  { name: 'The Nigerian Observer (Benin City, Edo State)', url: '' },
  { name: 'Daily Times (Nigeria) (Lagos)', url: '' },
];


export function SourcesManager() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = React.useState(false);

  const sourcesCollectionRef = React.useMemo(() => {
    return firestore ? collection(firestore, 'sources') : null;
  }, [firestore]);

  const { data: sources, isLoading } = useCollection(sourcesCollectionRef);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SourcesFormValues>({
    resolver: zodResolver(sourcesFormSchema),
    defaultValues: {
      sources: [{ name: '', url: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'sources',
  });

  const seededRef = React.useRef(false);

  React.useEffect(() => {
    // This effect should only run once to seed data if empty
    if (seededRef.current) return;

    if (firestore && !isLoading && sources && sources.length === 0) {
      seededRef.current = true; // Mark as attempting to seed
      setIsSeeding(true);

      const batch = writeBatch(firestore);
      initialSources.forEach((source) => {
        const docRef = doc(collection(firestore, 'sources'));
        batch.set(docRef, { ...source, id: docRef.id, createdAt: serverTimestamp() });
      });

      batch.commit().then(() => {
        toast({
          title: 'Initial sources seeded!',
          description: 'The default list of news sources has been added to the database.',
        });
        setIsSeeding(false);
      }).catch((error) => {
        const permissionError = new FirestorePermissionError({
          path: 'sources',
          operation: 'create',
          requestResourceData: initialSources,
        });
        errorEmitter.emit('permission-error', permissionError);

        toast({
          variant: 'destructive',
          title: 'Error seeding data',
          description: 'Could not seed the initial news sources due to a permission issue.',
        });
        setIsSeeding(false);
        // Allow retry if it failed? potentially, but let's avoid loop for now.
      });
    }
  }, [firestore, sources, isLoading, toast]);


  const onSubmit = (data: SourcesFormValues) => {
    if (!firestore) return;

    data.sources.forEach((source) => {
      if (source.name) {
        const newDocRef = doc(collection(firestore, 'sources'));
        setDocumentNonBlocking(newDocRef, {
          ...source,
          id: newDocRef.id,
          createdAt: serverTimestamp(),
        }, {});
      }
    });

    toast({
      title: 'Sources saved!',
      description: 'Your new sources have been successfully saved.',
    });
    reset({ sources: [{ name: '', url: '' }] });
  };

  const handleDelete = (sourceId: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'sources', sourceId);
    deleteDocumentNonBlocking(docRef);
    toast({
      title: 'Source Deleted',
      description: 'The source has been removed.',
    });
  }

  const SourcesSkeleton = () => (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex justify-between items-center bg-muted/25 p-2 rounded-md">
          <div className='w-full'>
            <Skeleton className="h-5 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="grid gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Manage News Sources</CardTitle>
          <CardDescription>
            Add new news sources to be used for report selection.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-end gap-4"
              >
                <div className="grid gap-2 flex-1">
                  <Label htmlFor={`sources.${index}.name`}>Source Name</Label>
                  <Input
                    id={`sources.${index}.name`}
                    {...register(`sources.${index}.name`)}
                    placeholder="e.g., The Guardian"
                  />
                  {errors.sources?.[index]?.name && (
                    <p className="text-sm text-destructive">
                      {errors.sources[index]?.name?.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2 flex-1">
                  <Label htmlFor={`sources.${index}.url`}>Source URL (Optional)</Label>
                  <Input
                    id={`sources.${index}.url`}
                    {...register(`sources.${index}.url`)}
                    placeholder="https://www.example.com"
                  />
                  {errors.sources?.[index]?.url && (
                    <p className="text-sm text-destructive">
                      {errors.sources[index]?.url?.message}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
            ))}
            <div className="flex justify-start">
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ name: '', url: '' })}
              >
                <PlusCircle className="mr-2" /> Add Another Source
              </Button>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={!isDirty}>
                Save New Sources
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Existing Sources</CardTitle>
          <CardDescription>List of currently available news sources.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading || isSeeding ? (
            <SourcesSkeleton />
          ) : (
            <ul className="space-y-2">
              {sources?.map((source) => (
                <li key={source.id} className="flex justify-between items-center bg-muted/25 p-2 rounded-md">
                  <div>
                    <p className="font-medium">{source.name}</p>
                    {source.url && <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:underline">{source.url}</a>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(source.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
