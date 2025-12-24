
const AUTO_CROP_THRESHOLD = 238;
const MIN_AUTO_CROP_AREA_REDUCTION = 0.08;

export interface FileMeta {
    [key: string]: {
        wasAutoCropped: boolean;
        originalName: string;
    }
}

export function buildFileMetaKey(file: File) {
    return `${file.name}-${file.lastModified}-${file.size}`;
}

export async function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(blob);
        const image = new Image();
        image.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(image);
        };
        image.onerror = (error) => {
            URL.revokeObjectURL(objectUrl);
            reject(error);
        };
        image.src = objectUrl;
    });
}

export function detectContentBounds(
    context: CanvasRenderingContext2D,
    width: number,
    height: number
) {
    const { data } = context.getImageData(0, 0, width, height);

    let top = height;
    let bottom = 0;
    let left = width;
    let right = 0;

    const stepX = Math.max(1, Math.floor(width / 1000));
    const stepY = Math.max(1, Math.floor(height / 1000));

    for (let y = 0; y < height; y += stepY) {
        for (let x = 0; x < width; x += stepX) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

            if (brightness < AUTO_CROP_THRESHOLD) {
                if (x < left) left = x;
                if (x > right) right = x;
                if (y < top) top = y;
                if (y > bottom) bottom = y;
            }
        }
    }

    if (left >= right || top >= bottom) {
        return null;
    }

    return { top, bottom, left, right };
}

export async function autoCropBlob(blob: Blob, fileName: string): Promise<{
    file: File;
    wasAutoCropped: boolean;
}> {
    try {
        const image = await loadImageFromBlob(blob);
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;

        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) {
            throw new Error('Unable to access canvas context');
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const bounds = detectContentBounds(context, canvas.width, canvas.height);
        if (!bounds) {
            return {
                file: new File([blob], fileName, {
                    type: blob.type,
                    lastModified: Date.now(),
                }),
                wasAutoCropped: false,
            };
        }

        const cropWidth = bounds.right - bounds.left;
        const cropHeight = bounds.bottom - bounds.top;
        const originalArea = canvas.width * canvas.height;
        const croppedArea = cropWidth * cropHeight;

        const areaReduction = 1 - croppedArea / originalArea;

        if (areaReduction < MIN_AUTO_CROP_AREA_REDUCTION) {
            return {
                file: new File([blob], fileName, {
                    type: blob.type,
                    lastModified: Date.now(),
                }),
                wasAutoCropped: false,
            };
        }

        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = cropWidth;
        croppedCanvas.height = cropHeight;
        const croppedContext = croppedCanvas.getContext('2d');
        if (!croppedContext) {
            throw new Error('Unable to access cropped canvas context');
        }

        croppedContext.drawImage(
            canvas,
            bounds.left,
            bounds.top,
            cropWidth,
            cropHeight,
            0,
            0,
            cropWidth,
            cropHeight
        );

        const outputType = blob.type || 'image/png';
        const croppedBlob = await new Promise<Blob | null>((resolve) =>
            croppedCanvas.toBlob((canvasBlob) => resolve(canvasBlob), outputType, 0.95)
        );

        if (!croppedBlob) {
            throw new Error('Failed to create cropped image blob');
        }

        const normalizedName = fileName.replace(/\.(\w+)$/, '');
        const extension = outputType.split('/')[1] || 'png';

        return {
            file: new File([croppedBlob], `${normalizedName}-cropped.${extension}`, {
                type: outputType,
                lastModified: Date.now(),
            }),
            wasAutoCropped: true,
        };
    } catch (error) {
        console.warn('Auto-crop failed, using original image', error);
        return {
            file: new File([blob], fileName, {
                type: blob.type,
                lastModified: Date.now(),
            }),
            wasAutoCropped: false,
        };
    }
}

export function formatFileSize(bytes: number) {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const power = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        units.length - 1
    );
    const value = bytes / Math.pow(1024, power);
    return `${value.toFixed(value >= 10 || power === 0 ? 0 : 1)} ${units[power]}`;
}
